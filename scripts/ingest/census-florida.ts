/**
 * Census adapter: Florida geographic registry.
 *
 *   discover -> acquire (checksummed) -> normalize -> validate (Zod) -> derive
 *   relations -> write seed/generated/*.json (the reviewed, committed snapshot)
 *
 * Usage:  npm run ingest:census [-- --refresh] [-- --dry-run]
 *
 * Sources (all U.S. Census Bureau, public domain):
 *  - 2026 Gazetteer files (states, counties, places): official codes, areas, internal points
 *  - Vintage 2025 population estimates (county + sub-county): populations and place->county parts
 *  - 2024 cartographic boundary files (1:20m for display, 1:500k for CDP->county derivation)
 */
import { unzipSync } from "fflate";
import * as shapefile from "shapefile";
import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import path from "node:path";
import { acquire, hasFlag, parseDelimited, SEED_DIR, writeJson, type Downloaded } from "./lib";
import { slugify } from "../../src/lib/text";
import {
  censusBundleSchema,
  type Area,
  type AreaRelation,
  type CoverageUniverse,
  type Fact,
  type Source,
} from "../../src/lib/domain/schemas";

const refresh = hasFlag("--refresh");
const dryRun = hasFlag("--dry-run");
const FL = "12";

const URLS = {
  gazState: "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_state_national.zip",
  gazCounty: "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_counties_national.zip",
  gazPlace: "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_place_national.zip",
  popCounty: "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv",
  popSub: "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_12.csv",
  cbState20m: "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_state_20m.zip",
  cbCounty20m: "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_20m.zip",
  cbCounty500k: "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_500k.zip",
};

const CENSUS_TERMS = "https://www.census.gov/about/policies/open-gov/open-data.html";
const PUBLIC_DOMAIN = "Public domain (U.S. federal government work); credit U.S. Census Bureau";

function src(id: string, d: Downloaded, extra: Omit<Source, "id" | "kind" | "license" | "termsUrl" | "redisplayPermitted" | "retrievedAt" | "checksumSha256" | "publisher" | "expectedFields"> & { expectedFields: string[] }): Source {
  return {
    id,
    kind: "dataset",
    publisher: "U.S. Census Bureau",
    license: PUBLIC_DOMAIN,
    termsUrl: CENSUS_TERMS,
    redisplayPermitted: true,
    retrievedAt: d.retrievedAt,
    checksumSha256: d.sha256,
    ...extra,
  };
}

function unzipText(d: Downloaded, suffix: string, encoding: "utf-8" | "latin1" = "utf-8"): string {
  const files = unzipSync(new Uint8Array(d.bytes));
  const key = Object.keys(files).find((k) => k.endsWith(suffix));
  if (!key) throw new Error(`${suffix} not found in ${path.basename(d.file)}`);
  return Buffer.from(files[key]!).toString(encoding);
}

async function readShapes(d: Downloaded): Promise<FeatureCollection> {
  const files = unzipSync(new Uint8Array(d.bytes));
  const shp = Object.keys(files).find((k) => k.endsWith(".shp"));
  const dbf = Object.keys(files).find((k) => k.endsWith(".dbf"));
  if (!shp || !dbf) throw new Error(`shapefile parts missing in ${d.file}`);
  return shapefile.read(files[shp]!, files[dbf]!, { encoding: "utf-8" });
}

function roundGeometry(g: Geometry, digits: number): Geometry {
  const f = 10 ** digits;
  const r = (p: Position): Position => [Math.round(p[0]! * f) / f, Math.round(p[1]! * f) / f];
  switch (g.type) {
    case "Polygon":
      return { type: "Polygon", coordinates: g.coordinates.map((ring) => ring.map(r)) };
    case "MultiPolygon":
      return { type: "MultiPolygon", coordinates: g.coordinates.map((poly) => poly.map((ring) => ring.map(r))) };
    default:
      return g;
  }
}

const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));

/** "Jacksonville city" -> { name: "Jacksonville", label: "city" } */
function splitPlaceName(full: string): { name: string; label: string } {
  const m = full.match(/^(.*) (city|town|village|CDP)$/);
  return m ? { name: m[1]!, label: m[2]! } : { name: full, label: "" };
}

async function main() {
  // Sequential on purpose: polite to the server and keeps the cache manifest consistent.
  const d = {} as Record<keyof typeof URLS, Downloaded>;
  for (const [k, url] of Object.entries(URLS) as [keyof typeof URLS, string][]) d[k] = await acquire("census", url, { refresh });
  for (const [k, v] of Object.entries(d)) console.log(`${v.fromCache ? "cache" : "fetch"}  ${k.padEnd(12)} ${v.sha256.slice(0, 12)}  ${path.basename(v.file)}`);

  const sources: Source[] = [
    src("census-gazetteer-2026-states", d.gazState, {
      title: "2026 Gazetteer Files — States", url: URLS.gazState, datasetVersion: "2026",
      coverage: "50 states, District of Columbia, Puerto Rico", expectedFields: ["USPS", "GEOID", "ANSICODE", "NAME", "ALAND_SQMI", "AWATER_SQMI", "INTPTLAT", "INTPTLONG"],
      retrievalMethod: "HTTPS bulk download (zip)", refreshInterval: "Annual",
      limitations: "Areas and internal points reflect the Gazetteer vintage; not boundaries for legal use.",
    }),
    src("census-gazetteer-2026-counties", d.gazCounty, {
      title: "2026 Gazetteer Files — Counties", url: URLS.gazCounty, datasetVersion: "2026",
      coverage: "All U.S. counties and equivalents (Florida: 67)", expectedFields: ["GEOID", "ANSICODE", "NAME", "ALAND_SQMI", "AWATER_SQMI", "INTPTLAT", "INTPTLONG"],
      retrievalMethod: "HTTPS bulk download (zip)", refreshInterval: "Annual",
      limitations: "Does not include county seats or government websites.",
    }),
    src("census-gazetteer-2026-places", d.gazPlace, {
      title: "2026 Gazetteer Files — Places", url: URLS.gazPlace, datasetVersion: "2026",
      coverage: "Incorporated places and census designated places (CDPs)", expectedFields: ["GEOID", "ANSICODE", "NAME", "LSAD", "FUNCSTAT", "ALAND_SQMI", "INTPTLAT", "INTPTLONG"],
      retrievalMethod: "HTTPS bulk download (zip)", refreshInterval: "Annual",
      limitations: "No county field. CDPs are statistical areas, not municipalities. Unincorporated communities without a CDP are absent.",
    }),
    src("census-popest-v2025-counties", d.popCounty, {
      title: "Vintage 2025 County Population Totals (co-est2025-alldata)", url: URLS.popCounty, datasetVersion: "Vintage 2025",
      coverage: "U.S., states and counties", expectedFields: ["STATE", "COUNTY", "ESTIMATESBASE2020", "POPESTIMATE2025"],
      retrievalMethod: "HTTPS bulk download (csv)", refreshInterval: "Annual (each vintage revises earlier years)",
      limitations: "Estimates, not census counts. ESTIMATESBASE2020 is the April 1, 2020 estimates base, not the published 2020 Census count.",
    }),
    src("census-popest-v2025-subcounty-fl", d.popSub, {
      title: "Vintage 2025 Subcounty Population Totals — Florida (sub-est2025_12)", url: URLS.popSub, datasetVersion: "Vintage 2025",
      coverage: "Florida incorporated places and place parts within counties", expectedFields: ["SUMLEV", "COUNTY", "PLACE", "NAME", "ESTIMATESBASE2020", "POPESTIMATE2025"],
      retrievalMethod: "HTTPS bulk download (csv)", refreshInterval: "Annual",
      limitations: "Incorporated places only; CDPs are not included.",
    }),
    src("census-cb-2024-boundaries", d.cbCounty20m, {
      title: "2024 Cartographic Boundary Files — States and Counties (1:20m and 1:500k)", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html",
      datasetVersion: "2024", coverage: "U.S. states and counties", expectedFields: ["GEOID", "NAME", "geometry"],
      retrievalMethod: "HTTPS bulk download (shapefile zip)", refreshInterval: "Annual",
      limitations: "Generalized boundaries for small-scale display; shoreline clipped. Not for legal or survey use.",
    }),
  ];

  const areas: Area[] = [];
  const facts: Fact[] = [];
  const relations: AreaRelation[] = [];
  const universes: CoverageUniverse[] = [];

  const popFact = (slug: string, base: string | undefined, est: string | undefined, sourceId: string, ref: string) => {
    if (base) facts.push({ subjectKind: "area", subjectSlug: slug, key: "population-estimates-base-2020", value: Number(base), unit: "people", asOf: "2020-04-01", asOfLabel: "April 1, 2020 estimates base", sourceId, sourceRef: `${ref} ESTIMATESBASE2020`, reviewStatus: "imported" });
    if (est) facts.push({ subjectKind: "area", subjectSlug: slug, key: "population-estimate", value: Number(est), unit: "people", asOf: "2025-07-01", asOfLabel: "July 1, 2025 estimate (Vintage 2025)", sourceId, sourceRef: `${ref} POPESTIMATE2025`, reviewStatus: "imported" });
  };
  const areaFacts = (slug: string, land: number | undefined, water: number | undefined, sourceId: string, ref: string) => {
    if (land !== undefined) facts.push({ subjectKind: "area", subjectSlug: slug, key: "land-area", value: land, unit: "sq mi", asOfLabel: "2026 Gazetteer", sourceId, sourceRef: `${ref} ALAND_SQMI`, reviewStatus: "imported" });
    if (water !== undefined) facts.push({ subjectKind: "area", subjectSlug: slug, key: "water-area", value: water, unit: "sq mi", asOfLabel: "2026 Gazetteer", sourceId, sourceRef: `${ref} AWATER_SQMI`, reviewStatus: "imported" });
  };

  // ---- country
  areas.push({ slug: "united-states", name: "United States", officialName: "United States of America", areaType: "country", codes: { geoid: "US" }, aliases: ["USA", "U.S.", "America"], sourceIds: ["census-gazetteer-2026-states"], reviewStatus: "imported", programStatus: "active" });

  // ---- states (registry only, except Florida)
  const popRows = parseDelimited(d.popCounty.bytes.toString("latin1"), ",");
  const popState = new Map(popRows.filter((r) => r.SUMLEV === "040").map((r) => [r.STATE!, r]));
  const popCounty = new Map(popRows.filter((r) => r.SUMLEV === "050" && r.STATE === FL).map((r) => [r.STATE! + r.COUNTY!, r]));
  const usRow = popRows.find((r) => r.SUMLEV === "010");
  if (usRow) popFact("united-states", usRow.ESTIMATESBASE2020, usRow.POPESTIMATE2025, "census-popest-v2025-counties", "SUMLEV 010");

  const states = parseDelimited(unzipText(d.gazState, ".txt"), "|");
  const stateSlugByFips = new Map<string, string>();
  for (const r of states) {
    const fips = r.GEOID!;
    const slug = slugify(r.NAME!);
    stateSlugByFips.set(fips, slug);
    const type = fips === "11" ? "federal_district" : fips === "72" ? "territory" : "state";
    areas.push({
      slug, name: r.NAME!, areaType: type, typeLabel: type === "state" ? "State" : type === "territory" ? "Territory" : "Federal district",
      parentSlug: "united-states", codes: { geoid: fips, fips, ansi: r.ANSICODE, usps: r.USPS },
      landAreaSqMi: num(r.ALAND_SQMI), waterAreaSqMi: num(r.AWATER_SQMI), internalPoint: { lat: Number(r.INTPTLAT), lon: Number(r.INTPTLONG) },
      aliases: [r.USPS!], sourceIds: ["census-gazetteer-2026-states"], reviewStatus: "imported", programStatus: fips === FL ? "active" : "registry_only",
    });
    areaFacts(slug, num(r.ALAND_SQMI), num(r.AWATER_SQMI), "census-gazetteer-2026-states", `GEOID ${fips}`);
    const p = popState.get(fips);
    if (p) popFact(slug, p.ESTIMATESBASE2020, p.POPESTIMATE2025, "census-popest-v2025-counties", `STATE ${fips}`);
  }
  const stateCount = areas.filter((a) => a.areaType === "state").length;

  // ---- Florida counties
  const counties = parseDelimited(unzipText(d.gazCounty, ".txt"), "|").filter((r) => r.GEOID!.startsWith(FL));
  const countySlugByGeoid = new Map<string, string>();
  for (const r of counties) {
    const name = r.NAME!; // "Duval County"
    const slug = `${slugify(name)}-fl`;
    countySlugByGeoid.set(r.GEOID!, slug);
    areas.push({
      slug, name, areaType: "county", typeLabel: "County", parentSlug: "florida",
      codes: { geoid: r.GEOID, fips: r.GEOID!.slice(2), ansi: r.ANSICODE },
      landAreaSqMi: num(r.ALAND_SQMI), waterAreaSqMi: num(r.AWATER_SQMI), internalPoint: { lat: Number(r.INTPTLAT), lon: Number(r.INTPTLONG) },
      aliases: [name.replace(/ County$/, "")], sourceIds: ["census-gazetteer-2026-counties", "census-popest-v2025-counties"], reviewStatus: "imported", programStatus: "active",
    });
    areaFacts(slug, num(r.ALAND_SQMI), num(r.AWATER_SQMI), "census-gazetteer-2026-counties", `GEOID ${r.GEOID}`);
    const p = popCounty.get(r.GEOID!);
    if (p) popFact(slug, p.ESTIMATESBASE2020, p.POPESTIMATE2025, "census-popest-v2025-counties", `GEOID ${r.GEOID}`);
  }
  if (counties.length !== 67) throw new Error(`Expected 67 Florida counties, got ${counties.length}`);
  universes.push({ id: "fl-counties-2026", areaSlug: "florida", label: "Florida counties", definition: "Counties in Florida listed in the Census 2026 Gazetteer county file (STATEFP 12).", areaType: "county", denominator: counties.length, asOf: "2026-01-01", sourceId: "census-gazetteer-2026-counties" });

  // ---- places (incorporated + CDP)
  const sub = parseDelimited(d.popSub.bytes.toString("latin1"), ",");
  const placePop = new Map(sub.filter((r) => r.SUMLEV === "162").map((r) => [FL + r.PLACE!, r]));
  const placeParts = sub.filter((r) => r.SUMLEV === "157");

  const gazPlaces = parseDelimited(unzipText(d.gazPlace, ".txt"), "|").filter((r) => r.USPS === "FL");
  const usedSlugs = new Set(areas.map((a) => a.slug));
  const placeSlugByGeoid = new Map<string, string>();

  // CDP -> county derivation uses 1:500k county polygons (internal point within).
  const county500k = await readShapes(d.cbCounty500k);
  const flCounty500k = county500k.features.filter((f) => f.properties?.STATEFP === FL);

  // Names repeated within Florida (e.g. two "Midway" CDPs) get a county qualifier on every copy.
  const nameCounts = new Map<string, number>();
  for (const r of gazPlaces) {
    const n = slugify(splitPlaceName(r.NAME!).name);
    nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1);
  }
  const containerOf = (point: { lat: number; lon: number }) => flCounty500k.find((f) => geoContains(f as Feature, [point.lon, point.lat]));

  let municipalities = 0;
  let cdps = 0;
  for (const r of gazPlaces) {
    const geoid = r.GEOID!;
    const { name, label } = splitPlaceName(r.NAME!);
    const incorporated = r.FUNCSTAT === "A";
    const point = { lat: Number(r.INTPTLAT), lon: Number(r.INTPTLONG) };
    const container = containerOf(point);
    let slug = `${slugify(name)}-fl`;
    if ((nameCounts.get(slugify(name)) ?? 0) > 1 || usedSlugs.has(slug)) {
      const qualifier = container ? slugify(String(container.properties!.NAME)) : geoid;
      slug = `${slugify(name)}-${incorporated ? label.toLowerCase() : "cdp"}-${qualifier}-fl`;
    }
    if (usedSlugs.has(slug)) throw new Error(`slug collision: ${slug}`);
    usedSlugs.add(slug);
    placeSlugByGeoid.set(geoid, slug);

    let parentSlug = "florida";
    if (incorporated) {
      municipalities++;
      const parts = placeParts.filter((p) => FL + p.PLACE === geoid);
      if (parts.length === 0) throw new Error(`No county parts for ${r.NAME}`);
      const primary = [...parts].sort((a, b) => Number(b.ESTIMATESBASE2020) - Number(a.ESTIMATESBASE2020))[0]!;
      parentSlug = countySlugByGeoid.get(FL + primary.COUNTY)!;
      for (const p of parts) {
        relations.push({
          areaSlug: slug, relatedSlug: countySlugByGeoid.get(FL + p.COUNTY)!, relationType: "intersects", sourceId: "census-popest-v2025-subcounty-fl",
          method: `Place part record (SUMLEV 157); April 1, 2020 estimates base within county: ${p.ESTIMATESBASE2020}.${parts.length > 1 ? " Breadcrumb parent = county part with the largest population." : ""}`,
          reviewStatus: "imported",
        });
      }
      const pp = placePop.get(geoid);
      if (pp) popFact(slug, pp.ESTIMATESBASE2020, pp.POPESTIMATE2025, "census-popest-v2025-subcounty-fl", `PLACE ${geoid}`);
    } else {
      cdps++;
      if (container) {
        const cSlug = countySlugByGeoid.get(container.properties!.GEOID as string)!;
        relations.push({
          areaSlug: slug, relatedSlug: cSlug, relationType: "contains_internal_point_of", sourceId: "census-cb-2024-boundaries",
          method: "Derived: Gazetteer internal point falls inside the 2024 1:500k county polygon. A CDP may extend into other counties; full intersection pending PostGIS import (Phase 2).",
          reviewStatus: "imported",
        });
      }
    }
    areas.push({
      slug, name, officialName: r.NAME, areaType: incorporated ? "municipality" : "cdp", typeLabel: incorporated ? label : "CDP",
      parentSlug, codes: { geoid, fips: geoid.slice(2), ansi: r.ANSICODE, funcstat: r.FUNCSTAT },
      landAreaSqMi: num(r.ALAND_SQMI), waterAreaSqMi: num(r.AWATER_SQMI), internalPoint: point,
      aliases: [], sourceIds: incorporated ? ["census-gazetteer-2026-places", "census-popest-v2025-subcounty-fl"] : ["census-gazetteer-2026-places"],
      reviewStatus: "imported", programStatus: "registry_only",
      ...(incorporated ? {} : { boundaryNote: "Census designated place: a statistical area, not an incorporated municipality." }),
    });
    areaFacts(slug, num(r.ALAND_SQMI), num(r.AWATER_SQMI), "census-gazetteer-2026-places", `GEOID ${geoid}`);
  }
  if (municipalities !== placePop.size) throw new Error(`Gazetteer has ${municipalities} incorporated places, popest has ${placePop.size}`);
  universes.push({ id: "fl-municipalities-2026", areaSlug: "florida", label: "Florida incorporated municipalities", definition: "Places in Florida with functional status A (active government) in the Census 2026 Gazetteer place file.", areaType: "municipality", denominator: municipalities, asOf: "2026-01-01", sourceId: "census-gazetteer-2026-places" });
  universes.push({ id: "fl-cdps-2026", areaSlug: "florida", label: "Florida census designated places", definition: "Places in Florida with functional status S (statistical entity) in the Census 2026 Gazetteer place file.", areaType: "cdp", denominator: cdps, asOf: "2026-01-01", sourceId: "census-gazetteer-2026-places" });
  universes.push({ id: "us-states-2026", areaSlug: "united-states", label: "U.S. states", definition: "The 50 states (excluding DC and territories) in the Census 2026 Gazetteer state file.", areaType: "state", denominator: stateCount, asOf: "2026-01-01", sourceId: "census-gazetteer-2026-states" });

  // Jacksonville: consolidated city-county government (Census place relation fact).
  const jax = areas.find((a) => a.slug === "jacksonville-fl");
  if (!jax) throw new Error("Jacksonville not found");
  jax.programStatus = "active";
  jax.aliases = ["Jax", "City of Jacksonville"];
  areas.find((a) => a.slug === "duval-county-fl")!.programStatus = "active";

  // ---- geometry for display (1:20m)
  const states20 = await readShapes(d.cbState20m);
  const counties20 = await readShapes(d.cbCounty20m);
  const stateFeatures = states20.features
    .filter((f) => stateSlugByFips.has(f.properties?.STATEFP as string))
    .map((f) => ({ type: "Feature" as const, properties: { slug: stateSlugByFips.get(f.properties!.STATEFP as string)!, name: f.properties!.NAME as string }, geometry: roundGeometry(f.geometry, 3) }));
  const countyFeatures = counties20.features
    .filter((f) => f.properties?.STATEFP === FL)
    .map((f) => ({ type: "Feature" as const, properties: { slug: countySlugByGeoid.get(f.properties!.GEOID as string)!, name: f.properties!.NAMELSAD as string }, geometry: roundGeometry(f.geometry, 4) }));
  if (countyFeatures.length !== 67) throw new Error(`Expected 67 county geometries, got ${countyFeatures.length}`);

  const bundle = censusBundleSchema.parse({
    generatedAt: new Date().toISOString(),
    generator: "scripts/ingest/census-florida.ts",
    sources, areas, areaRelations: relations, facts, coverageUniverses: universes,
  });

  const report = { areas: areas.length, states: stateCount, counties: counties.length, municipalities, cdps, cdpCountyLinks: relations.filter((r) => r.relationType === "contains_internal_point_of").length, municipalityCountyParts: relations.filter((r) => r.relationType === "intersects").length, facts: facts.length, stateGeometries: stateFeatures.length, countyGeometries: countyFeatures.length };
  console.table(report);
  if (dryRun) {
    console.log("dry run: nothing written");
    return;
  }
  writeJson(path.join(SEED_DIR, "generated", "census-florida.json"), bundle);
  writeJson(path.join(SEED_DIR, "generated", "geometry.json"), {
    generatedAt: bundle.generatedAt,
    sourceId: "census-cb-2024-boundaries",
    note: "Generalized 1:20m cartographic boundaries for display only. Coordinates rounded.",
    states: { type: "FeatureCollection", features: stateFeatures },
    floridaCounties: { type: "FeatureCollection", features: countyFeatures },
  });
  console.log("wrote seed/generated/census-florida.json and seed/generated/geometry.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
