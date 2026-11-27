/**
 * Phase 2 geography adapter for Florida.
 *
 *  1. Exact place/county intersections: Census 2025 cartographic boundary polygons
 *     (places + counties, 1:500k) intersected in PostGIS, with area shares.
 *  2. County seats + official websites: Wikidata (CC0), seat linked by GNIS id.
 *  3. Named populated places: USGS GNIS Domestic Names (public domain), deduplicated
 *     against Census places and curated neighborhoods, placed by point-in-polygon.
 *
 * Needs the local PostGIS container (`npm run db:up`) for the spatial work only;
 * the output is a committed JSON bundle, so the website never needs PostGIS.
 *
 * Usage: npm run ingest:geography [-- --refresh] [-- --dry-run]
 */
import { unzipSync } from "fflate";
import * as shapefile from "shapefile";
import path from "node:path";
import { readFileSync } from "node:fs";
import type { FeatureCollection } from "geojson";
import { acquire, hasFlag, parseDelimited, SEED_DIR, sha256, USER_AGENT, writeJson, type Downloaded } from "./lib";
import { ownerUrl, withClient } from "../db/common";
import { normalize, slugify } from "../../src/lib/text";
import {
  censusBundleSchema,
  entitySeedFileSchema,
  geographyBundleSchema,
  type Area,
  type AreaRelation,
  type CoverageUniverse,
  type Fact,
  type Source,
} from "../../src/lib/domain/schemas";

const refresh = hasFlag("--refresh");
const dryRun = hasFlag("--dry-run");
const FL = "12";
const SQMI = 2_589_988.110336; // m² per square mile
const MIN_SHARE = 0.001; // ignore boundary slivers below 0.1 % of a place's area
const MIN_SQMI = 0.01;

const URLS = {
  places: "https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_12_place_500k.zip",
  counties: "https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip",
  gnis: "https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_FL_Text.zip",
};
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";

async function readShapes(d: Downloaded): Promise<FeatureCollection> {
  const files = unzipSync(new Uint8Array(d.bytes));
  const shp = Object.keys(files).find((k) => k.endsWith(".shp"))!;
  const dbf = Object.keys(files).find((k) => k.endsWith(".dbf"))!;
  return shapefile.read(files[shp]!, files[dbf]!, { encoding: "utf-8" });
}

const stripZeros = (s: string) => s.replace(/^0+/, "");
/** Name comparison tolerant to "St."/"Saint" and spacing ("De Funiak" = "DeFuniak"). */
const looseName = (s: string) => normalize(s).replace(/\bsaint\b/g, "st").replace(/\s+/g, "");

type WikidataCounty = { item: string; fips: string; seatLabel: string | null; seatGnis: string | null; sites: string[] };

async function fetchCountySeats(): Promise<{ rows: WikidataCounty[]; retrievedAt: string; checksum: string; query: string }> {
  const query = `SELECT ?c ?fips ?seatLabel ?seatGnis ?site WHERE {
  ?c wdt:P882 ?fips . FILTER(STRSTARTS(?fips, "12") && STRLEN(?fips) = 5)
  OPTIONAL { ?c p:P36 ?st . ?st ps:P36 ?seat . FILTER NOT EXISTS { ?st pq:P582 ?end } OPTIONAL { ?seat wdt:P590 ?seatGnis } }
  OPTIONAL { ?c wdt:P856 ?site }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
  const res = await fetch(`${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}`, {
    headers: { "user-agent": USER_AGENT, accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL HTTP ${res.status}`);
  const text = await res.text();
  const json = JSON.parse(text) as { results: { bindings: Record<string, { value: string }>[] } };
  const byFips = new Map<string, WikidataCounty>();
  for (const b of json.results.bindings) {
    const fips = b.fips!.value;
    const row = byFips.get(fips) ?? { item: b.c!.value.split("/").pop()!, fips, seatLabel: null, seatGnis: null, sites: [] };
    if (b.seatLabel && !row.seatLabel) row.seatLabel = b.seatLabel.value;
    if (b.seatGnis && !row.seatGnis) row.seatGnis = b.seatGnis.value;
    if (b.site && !row.sites.includes(b.site.value)) row.sites.push(b.site.value);
    byFips.set(fips, row);
  }
  for (const r of byFips.values()) r.sites.sort();
  return { rows: [...byFips.values()], retrievedAt: new Date().toISOString(), checksum: sha256(text), query };
}

async function main() {
  const census = censusBundleSchema.parse(JSON.parse(readFileSync(path.join(SEED_DIR, "generated", "census-florida.json"), "utf8")));
  const curated = entitySeedFileSchema.parse(JSON.parse(readFileSync(path.join(SEED_DIR, "curated", "jacksonville.json"), "utf8")));

  const d = {} as Record<keyof typeof URLS, Downloaded>;
  for (const [k, url] of Object.entries(URLS) as [keyof typeof URLS, string][]) d[k] = await acquire("geography", url, { refresh });
  for (const [k, v] of Object.entries(d)) console.log(`${v.fromCache ? "cache" : "fetch"}  ${k.padEnd(9)} ${v.sha256.slice(0, 12)}  ${path.basename(v.file)}`);
  const wd = await fetchCountySeats();
  console.log(`fetch  wikidata  ${wd.checksum.slice(0, 12)}  ${wd.rows.length} counties`);

  const sources: Source[] = [
    {
      id: "census-cb-2025-places-counties", kind: "dataset", publisher: "U.S. Census Bureau", title: "2025 Cartographic Boundary Files — Florida places and U.S. counties (1:500k)",
      url: "https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html", datasetVersion: "2025",
      license: "Public domain (U.S. federal government work); credit U.S. Census Bureau", termsUrl: "https://www.census.gov/about/policies/open-gov/open-data.html", redisplayPermitted: true,
      coverage: "Florida incorporated places and CDPs; all U.S. counties", expectedFields: ["GEOID", "geometry"], retrievalMethod: "HTTPS bulk download (shapefile zip); intersections computed in PostGIS",
      refreshInterval: "Annual", limitations: "Generalized and shoreline-clipped; area shares are approximate near coasts and boundaries.",
      retrievedAt: d.places.retrievedAt, checksumSha256: d.places.sha256,
    },
    {
      id: "usgs-gnis-domestic-names-fl", kind: "dataset", publisher: "U.S. Geological Survey", title: "GNIS Domestic Names — Florida",
      url: URLS.gnis, datasetVersion: `retrieved ${d.gnis.retrievedAt.slice(0, 10)}`,
      license: "Public domain (U.S. federal government work); credit USGS GNIS", termsUrl: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits", redisplayPermitted: true,
      coverage: "Official federal names of Florida geographic features", expectedFields: ["feature_id", "feature_name", "feature_class", "county_numeric", "prim_lat_dec", "prim_long_dec"],
      retrievalMethod: "HTTPS bulk download (pipe-delimited text)", refreshInterval: "Quarterly",
      limitations: "'Populated Place' includes communities, neighborhoods, subdivisions and some historical settlements; it is a naming registry, not a list of governments.",
      retrievedAt: d.gnis.retrievedAt, checksumSha256: d.gnis.sha256,
    },
    {
      id: "wikidata-fl-county-seats", kind: "reference", publisher: "Wikidata (Wikimedia Foundation)", title: "Wikidata — Florida counties: county seat (P36) and official website (P856)",
      url: "https://query.wikidata.org/", datasetVersion: `SPARQL snapshot ${wd.retrievedAt.slice(0, 10)}`,
      license: "CC0 1.0 (public domain dedication)", termsUrl: "https://www.wikidata.org/wiki/Wikidata:Licensing", redisplayPermitted: true,
      coverage: "67 Florida counties", expectedFields: ["P882 FIPS", "P36 capital", "P590 GNIS id", "P856 official website"],
      retrievalMethod: "SPARQL query (current statements only)", refreshInterval: "Quarterly",
      limitations: "Community-edited secondary source used because the official Florida Department of State directory refuses automated access. Websites are separately link-checked.",
      retrievedAt: wd.retrievedAt, checksumSha256: wd.checksum,
    },
  ];

  const areaByGeoid = new Map(census.areas.filter((a) => a.codes.geoid).map((a) => [`${a.areaType === "county" ? "c" : "p"}${a.codes.geoid}`, a]));
  const areaByAnsi = new Map(census.areas.filter((a) => a.codes.ansi).map((a) => [stripZeros(a.codes.ansi!), a]));
  const countyByFips3 = new Map(census.areas.filter((a) => a.areaType === "county").map((a) => [a.codes.fips!, a]));

  const placesFc = await readShapes(d.places);
  const countiesFc = await readShapes(d.counties);
  const flCounties = countiesFc.features.filter((f) => f.properties?.STATEFP === FL);
  const gnisFiles = unzipSync(new Uint8Array(d.gnis.bytes));
  const gnisText = Buffer.from(gnisFiles[Object.keys(gnisFiles).find((k) => k.endsWith(".txt"))!]!).toString("utf8");
  const gnis = parseDelimited(gnisText, "|").filter((r) => r.feature_class === "Populated Place" && r.state_numeric === FL && r.prim_lat_dec && Number(r.prim_lat_dec) !== 0);

  const spatial = await withClient(ownerUrl(), async (c) => {
    await c.query("set search_path = public");
    await c.query("create temp table t_county (geoid text primary key, geom geometry(MultiPolygon, 4326))");
    await c.query("create temp table t_place (geoid text primary key, geom geometry(MultiPolygon, 4326))");
    await c.query("create temp table t_gnis (id text primary key, lon float8, lat float8, geom geometry(Point, 4326))");
    const load = (table: string, feats: { geoid: string; geometry: unknown }[]) =>
      c.query(`insert into ${table} select x.geoid, st_multi(st_collectionextract(st_makevalid(st_setsrid(st_geomfromgeojson(x.g), 4326)), 3))
               from jsonb_to_recordset($1::jsonb) as x(geoid text, g text)`, [JSON.stringify(feats.map((f) => ({ geoid: f.geoid, g: JSON.stringify(f.geometry) })))]);
    await load("t_county", flCounties.map((f) => ({ geoid: f.properties!.GEOID as string, geometry: f.geometry })));
    await load("t_place", placesFc.features.map((f) => ({ geoid: f.properties!.GEOID as string, geometry: f.geometry })));
    await c.query(`insert into t_gnis select x.id, x.lon, x.lat, st_setsrid(st_makepoint(x.lon, x.lat), 4326) from jsonb_to_recordset($1::jsonb) as x(id text, lon float8, lat float8)`,
      [JSON.stringify(gnis.map((r) => ({ id: r.feature_id, lon: Number(r.prim_long_dec), lat: Number(r.prim_lat_dec) })))]);
    await c.query("create index on t_county using gist (geom); create index on t_place using gist (geom); create index on t_gnis using gist (geom); analyze t_county; analyze t_place; analyze t_gnis");
    const inter = await c.query<{ place: string; county: string; share: number; sqmi: number }>(`
      select p.geoid as place, k.geoid as county,
             st_area(st_intersection(p.geom, k.geom)::geography) / nullif(st_area(p.geom::geography), 0) as share,
             st_area(st_intersection(p.geom, k.geom)::geography) / ${SQMI} as sqmi
      from t_place p join t_county k on st_intersects(p.geom, k.geom)`);
    const inPlace = await c.query<{ id: string; place: string }>(`
      select g.id, p.geoid as place from t_gnis g join t_place p on st_contains(p.geom, g.geom)`);
    const inCounty = await c.query<{ id: string; county: string }>(`
      select g.id, k.geoid as county from t_gnis g join t_county k on st_contains(k.geom, g.geom)`);
    const shapes = await c.query<{ geoid: string; g: string }>(`select geoid, st_asgeojson(st_simplifypreservetopology(geom, 0.0004), 4) as g from t_place`);
    return { inter: inter.rows, inPlace: inPlace.rows, inCounty: inCounty.rows, shapes: shapes.rows };
  });

  // ---------------------------------------------------------------- 1. intersections
  const relations: AreaRelation[] = [];
  const parentOverrides: { slug: string; parentSlug: string; reason: string }[] = [];
  const placesWithGeometry: string[] = [];
  const byPlace = new Map<string, { county: string; share: number; sqmi: number }[]>();
  for (const r of spatial.inter) {
    if (r.share === null || (r.share < MIN_SHARE && r.sqmi < MIN_SQMI)) continue;
    if (!byPlace.has(r.place)) byPlace.set(r.place, []);
    byPlace.get(r.place)!.push({ county: r.county, share: Number(r.share), sqmi: Number(r.sqmi) });
  }
  let multiCounty = 0;
  for (const [geoid, parts] of byPlace) {
    const place = areaByGeoid.get(`p${geoid}`);
    if (!place) continue; // place in 2025 boundaries but not in the 2026 Gazetteer
    placesWithGeometry.push(place.slug);
    parts.sort((a, b) => b.share - a.share);
    if (parts.length > 1) multiCounty++;
    for (const p of parts) {
      const county = areaByGeoid.get(`c${p.county}`)!;
      relations.push({
        areaSlug: place.slug, relatedSlug: county.slug, relationType: "intersects", sourceId: "census-cb-2025-places-counties",
        share: Math.round(p.share * 1e6) / 1e6,
        method: `PostGIS ST_Intersection of 2025 boundary polygons: ${(p.share * 100).toFixed(1)}% of the place's area (${p.sqmi.toFixed(2)} sq mi) lies in ${county.name}.`,
        reviewStatus: "imported",
      });
    }
    const primary = areaByGeoid.get(`c${parts[0]!.county}`)!;
    if (place.areaType === "cdp" && place.parentSlug !== primary.slug) {
      parentOverrides.push({ slug: place.slug, parentSlug: primary.slug, reason: `County containing the largest share (${(parts[0]!.share * 100).toFixed(1)}%) of the CDP's area.` });
    }
  }
  const placesMissing = census.areas.filter((a) => (a.areaType === "municipality" || a.areaType === "cdp") && !placesWithGeometry.includes(a.slug)).map((a) => a.slug);

  // ---------------------------------------------------------------- 2. county seats + websites
  const facts: Fact[] = [];
  let seatsLinked = 0;
  const seatIssues: string[] = [];
  // GNIS has two features per city: the "Populated Place" (settlement) and the "Civil" unit.
  // Wikidata's P590 usually points at the settlement, Census ANSI at the civil unit, so match
  // either directly by ANSI or by the settlement point lying inside a same-named Census place.
  const gnisPlace = new Map(spatial.inPlace.map((r) => [r.id, r.place]));
  const gnisName = new Map(gnis.map((r) => [r.feature_id!, r.feature_name!]));
  for (const row of wd.rows) {
    const county = countyByFips3.get(row.fips.slice(2));
    if (!county) continue;
    let seat = row.seatGnis ? areaByAnsi.get(stripZeros(row.seatGnis)) : undefined;
    let how = "matched to Census ANSI code";
    if (!seat && row.seatGnis) {
      const container = gnisPlace.has(row.seatGnis) ? areaByGeoid.get(`p${gnisPlace.get(row.seatGnis)}`) : undefined;
      const name = gnisName.get(row.seatGnis);
      if (container && name && looseName(container.name) === looseName(name)) {
        seat = container;
        how = `GNIS settlement point lies inside the same-named Census place (GEOID ${container.codes.geoid})`;
      }
    }
    if (!seat && row.seatLabel) {
      // Last resort: a Census place in this county whose name matches the seat label (St./Saint, spacing).
      const inCountyPlaces = relations.filter((r) => r.relationType === "intersects" && r.relatedSlug === county.slug).map((r) => r.areaSlug);
      const candidates = census.areas.filter((a) => inCountyPlaces.includes(a.slug) && looseName(a.name) === looseName(row.seatLabel!));
      if (candidates.length === 1) {
        seat = candidates[0];
        how = `seat label matched the name of the only same-named Census place intersecting the county (GEOID ${seat!.codes.geoid})`;
      }
    }
    if (seat) {
      seatsLinked++;
      relations.push({
        areaSlug: county.slug, relatedSlug: seat.slug, relationType: "county_seat", sourceId: "wikidata-fl-county-seats",
        method: `Wikidata ${row.item} P36 (current) → GNIS ${row.seatGnis}; ${how}.`, reviewStatus: "imported",
      });
    } else if (row.seatLabel) {
      seatIssues.push(`${county.name}: seat "${row.seatLabel}" (GNIS ${row.seatGnis ?? "none"}) not matched to a Census place`);
      facts.push({ subjectKind: "area", subjectSlug: county.slug, key: "county-seat", value: row.seatLabel, sourceId: "wikidata-fl-county-seats", sourceRef: `${row.item} P36`, reviewStatus: "unreviewed", note: "Seat not matched to a Census place by GNIS id." });
    }
    const site = row.sites.find((s) => /\.(gov|us|org|com|net)\b/.test(s));
    if (site) facts.push({ subjectKind: "area", subjectSlug: county.slug, key: "official-website", value: site.replace(/^http:\/\//, "https://"), sourceId: "wikidata-fl-county-seats", sourceRef: `${row.item} P856${row.sites.length > 1 ? ` (1 of ${row.sites.length})` : ""}`, reviewStatus: "imported" });
  }

  // ---------------------------------------------------------------- 3. GNIS populated places
  const inPlace = new Map(spatial.inPlace.map((r) => [r.id, r.place]));
  const inCounty = new Map(spatial.inCounty.map((r) => [r.id, r.county]));
  const curatedByParentName = new Map(curated.neighborhoods.flatMap((n) => [n.name, ...n.aliases].map((nm) => [`${n.parentSlug}|${normalize(nm)}`, n.slug] as const)));
  const areas: Area[] = [];
  const enrichments: { slug: string; ansi: string; internalPoint: { lat: number; lon: number }; sourceId: string }[] = [];
  const counts = { gnisPopulatedPlaces: gnis.length, sameAsCensusPlace: 0, mergedIntoCuratedNeighborhood: 0, insideMunicipality: 0, unincorporated: 0, outsideCounties: 0 };
  const usedSlugs = new Set([...census.areas, ...curated.neighborhoods].map((a) => a.slug));
  const slugCounts = new Map<string, number>();
  const pending: { r: Record<string, string>; parent: Area; inside: boolean; base: string }[] = [];

  for (const r of gnis) {
    const id = r.feature_id!;
    if (areaByAnsi.has(id)) { counts.sameAsCensusPlace++; continue; }
    const placeGeoid = inPlace.get(id);
    const container = placeGeoid ? areaByGeoid.get(`p${placeGeoid}`) : undefined;
    // The settlement itself, recorded twice (e.g. a "Populated Place" named like the city it sits in).
    if (container && normalize(container.name) === normalize(r.feature_name!)) { counts.sameAsCensusPlace++; continue; }
    const point = { lat: Number(r.prim_lat_dec), lon: Number(r.prim_long_dec) };
    if (container) {
      const curatedSlug = curatedByParentName.get(`${container.slug}|${normalize(r.feature_name!)}`);
      if (curatedSlug) {
        counts.mergedIntoCuratedNeighborhood++;
        enrichments.push({ slug: curatedSlug, ansi: id.padStart(8, "0"), internalPoint: point, sourceId: "usgs-gnis-domestic-names-fl" });
        continue;
      }
    }
    const countyGeoid = inCounty.get(id) ?? (r.county_numeric ? FL + r.county_numeric : undefined);
    const county = countyGeoid ? areaByGeoid.get(`c${countyGeoid}`) : undefined;
    if (!county) { counts.outsideCounties++; continue; }
    const inside = !!container && container.areaType === "municipality";
    const parent = inside ? container! : county;
    if (inside) counts.insideMunicipality++; else counts.unincorporated++;
    const base = `${slugify(r.feature_name!)}-${slugify(parent.name.replace(/ County$/, "-county"))}`.replace(/-fl$/, "");
    slugCounts.set(base, (slugCounts.get(base) ?? 0) + 1);
    pending.push({ r, parent, inside, base });
  }
  for (const { r, parent, inside, base } of pending) {
    let slug = `${base}-fl`;
    if ((slugCounts.get(base) ?? 0) > 1 || usedSlugs.has(slug)) slug = `${base}-${r.feature_id}-fl`;
    usedSlugs.add(slug);
    areas.push({
      slug, name: r.feature_name!, areaType: "community",
      typeLabel: inside ? `Named place within ${parent.name}` : "Unincorporated community",
      parentSlug: parent.slug, codes: { ansi: r.feature_id!.padStart(8, "0") },
      internalPoint: { lat: Number(r.prim_lat_dec), lon: Number(r.prim_long_dec) },
      aliases: [], sourceIds: ["usgs-gnis-domestic-names-fl"], reviewStatus: "imported", programStatus: "registry_only",
      boundaryNote: "USGS GNIS populated place: an officially named point, without a legal boundary. It may be a community, neighborhood, subdivision or historical settlement.",
    });
  }

  const universes: CoverageUniverse[] = [
    { id: "fl-county-seats", areaSlug: "florida", label: "Florida county seats linked", definition: "Florida counties whose county seat (Wikidata P36, current) is linked to a Census place by GNIS id.", areaType: "county", denominator: 67, asOf: wd.retrievedAt.slice(0, 10), sourceId: "wikidata-fl-county-seats", metric: "relation_count", relationType: "county_seat" },
    { id: "fl-gnis-communities", areaSlug: "florida", label: "GNIS named places (not Census places)", definition: `USGS GNIS 'Populated Place' features in Florida that are not themselves a Census place or a curated neighborhood (${counts.gnisPopulatedPlaces} records: ${counts.sameAsCensusPlace} same as a Census place, ${counts.mergedIntoCuratedNeighborhood} merged into curated neighborhoods, ${counts.outsideCounties} outside county polygons).`, areaType: "community", denominator: areas.length, asOf: d.gnis.retrievedAt.slice(0, 10), sourceId: "usgs-gnis-domestic-names-fl", metric: "area_count" },
  ];

  const stats = { ...counts, communitiesCreated: areas.length, placesWithGeometry: placesWithGeometry.length, placesMissingGeometry: placesMissing.length, multiCountyPlaces: multiCounty, cdpParentChanges: parentOverrides.length, countySeatsLinked: seatsLinked, countySeatsUnmatched: seatIssues.length, countyWebsites: facts.filter((f) => f.key === "official-website").length };
  console.table(stats);
  if (seatIssues.length) console.log("unmatched seats:\n  " + seatIssues.join("\n  "));
  if (placesMissing.length) console.log("places without 2025 polygon:", placesMissing.join(", "));

  const bundle = geographyBundleSchema.parse({
    generatedAt: new Date().toISOString(), generator: "scripts/ingest/florida-geography.ts",
    sources, areas, areaRelations: relations, facts, coverageUniverses: universes,
    parentOverrides, areaEnrichments: enrichments, placesWithGeometry, stats,
  });
  if (dryRun) {
    console.log("dry run: nothing written");
    return;
  }
  writeJson(path.join(SEED_DIR, "generated", "florida-geography.json"), bundle);
  const slugByGeoid = new Map(census.areas.filter((a) => a.codes.geoid).map((a) => [a.codes.geoid!, a.slug]));
  writeJson(path.join(SEED_DIR, "generated", "place-geometry.json"), {
    generatedAt: bundle.generatedAt, sourceId: "census-cb-2025-places-counties",
    note: "Florida place boundaries (incorporated + CDP), 2025 cartographic boundary files, simplified (0.0004°) for display only.",
    places: {
      type: "FeatureCollection",
      features: spatial.shapes.filter((s) => slugByGeoid.has(s.geoid)).map((s) => ({ type: "Feature", properties: { slug: slugByGeoid.get(s.geoid)!, geoid: s.geoid }, geometry: JSON.parse(s.g) })),
    },
  });
  console.log("wrote seed/generated/florida-geography.json and place-geometry.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
