/**
 * Enrichment adapter: notable places and brands for one area.
 *
 *   Wikidata (CC0)          -> notable places with an English Wikipedia article located in the area,
 *                              plus organizations headquartered there; structured facts and relations
 *   Wikipedia (CC BY-SA)    -> lead summary, shown verbatim with attribution
 *   Wikimedia Commons       -> photo / logo, only with a free license read from the file's metadata
 *   OpenStreetMap (ODbL)    -> brand presence: number of mapped locations per brand (brand:wikidata)
 *
 * Generic by design: `npm run ingest:enrich -- --area=<area-slug>` works for any area with a
 * boundary polygon (municipality, CDP or county). Output: seed/generated/enrich-<area>.json
 *
 * Etiquette: descriptive user agent, sequential requests, batching (50 ids per Wikidata call),
 * small delays. Raw responses are not stored; only the derived, attributed fields.
 */
import path from "node:path";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { unzipSync } from "fflate";
import * as shapefile from "shapefile";
import { geoArea, geoBounds, geoContains } from "d3-geo";
import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import { RAW_DIR, SEED_DIR, USER_AGENT, hasFlag, sha256, writeJson } from "./lib";
import { brandCategory, classify, EXCLUDE } from "./type-map";
import { normalize, slugify } from "../../src/lib/text";
import { loadGeometry, loadPlaceGeometry, loadSeedInputs } from "../../src/lib/data/inputs";
import { enrichmentBundleSchema, type EnrichedEntity, type Source } from "../../src/lib/domain/schemas";

const areaSlug = process.argv.find((a) => a.startsWith("--area="))?.slice(7) ?? "jacksonville-fl";
const skipOsm = hasFlag("--no-osm");
const WD_API = "https://www.wikidata.org/w/api.php";
const WD_SPARQL = "https://query.wikidata.org/sparql";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WP_API = "https://en.wikipedia.org/w/api.php";
const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const FREE_LICENSE = /^(cc0|cc[- ]zero|public domain|pd\b|pd-|cc[- ]by(-sa)?[- ]\d(\.\d)?|cc[- ]by(-sa)?$)/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const headers = { "user-agent": USER_AGENT, accept: "application/json" };
const CACHE_DIR = path.join(RAW_DIR, "enrich-cache");
const PACE_MS = Number(process.env.ENRICH_PACE_MS ?? 1200); // gap between live requests (Wikimedia rate limits)
let lastLive = 0;
let liveRequests = 0;
let cacheHits = 0;

/**
 * GET/POST JSON with an on-disk response cache (re-runs never repeat a request),
 * pacing between live requests, and polite retries (Retry-After on 429, backoff on 5xx).
 */
async function getJson<T>(url: string, init: RequestInit = {}, tries = 6): Promise<T> {
  const key = sha256(`${init.method ?? "GET"} ${url} ${typeof init.body === "string" ? init.body : init.body ? String(init.body) : ""}`);
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (existsSync(file)) {
    cacheHits++;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  }
  for (let i = 1; ; i++) {
    const gap = Date.now() - lastLive;
    if (gap < PACE_MS) await sleep(PACE_MS - gap);
    lastLive = Date.now();
    liveRequests++;
    const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    if (res.ok) {
      const text = await res.text();
      mkdirSync(CACHE_DIR, { recursive: true });
      writeFileSync(file, text);
      return JSON.parse(text) as T;
    }
    if (i >= tries || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url.slice(0, 120)}`);
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Math.min(Math.max(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0, 5000 * 2 ** (i - 1)), 60_000);
    console.log(`  HTTP ${res.status} on ${new URL(url).hostname}, waiting ${Math.round(wait / 1000)}s (retry ${i}/${tries - 1})`);
    await sleep(wait);
  }
}

// ---------------------------------------------------------------- geometry helpers
type Poly = Feature<Polygon | MultiPolygon>;
/** d3-geo expects clockwise exterior rings; flip rings if the polygon covers more than a hemisphere. */
function d3Ready(f: Feature<Geometry>): Poly {
  const g = f.geometry as Polygon | MultiPolygon;
  const feat = { type: "Feature", properties: {}, geometry: g } as Poly;
  if (geoArea(feat) > 2 * Math.PI) {
    const rev = (rings: number[][][]) => rings.map((r) => [...r].reverse());
    feat.geometry = g.type === "Polygon" ? { type: "Polygon", coordinates: rev(g.coordinates) } : { type: "MultiPolygon", coordinates: g.coordinates.map(rev) };
  }
  return feat;
}

let countyShapes: Feature<Geometry, Record<string, unknown>>[] | null = null;
async function county500k(geoid: string): Promise<Feature<Geometry> | undefined> {
  if (!countyShapes) {
    const zip = path.join(RAW_DIR, "geography", "cb_2025_us_county_500k.zip");
    if (!existsSync(zip)) return undefined; // run ingest:geography first; falls back to the 1:20m outline
    const files = unzipSync(new Uint8Array(readFileSync(zip)));
    const shp = Object.keys(files).find((k) => k.endsWith(".shp"))!;
    const dbf = Object.keys(files).find((k) => k.endsWith(".dbf"))!;
    countyShapes = (await shapefile.read(files[shp]!, files[dbf]!, { encoding: "utf-8" })).features as Feature<Geometry, Record<string, unknown>>[];
  }
  return countyShapes.find((f) => f.properties.GEOID === geoid);
}

// ---------------------------------------------------------------- Wikidata helpers
type Snak = { datavalue?: { type: string; value: unknown } };
type Claim = { rank: string; mainsnak: Snak };
type WdEntity = { id: string; labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; aliases?: Record<string, { value: string }[]>; claims?: Record<string, Claim[]>; sitelinks?: Record<string, { title: string; url?: string }> };

async function wbget(ids: string[], props: string): Promise<Map<string, WdEntity>> {
  const out = new Map<string, WdEntity>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `${WD_API}?action=wbgetentities&format=json&languages=en&sitefilter=enwiki&props=${props}&ids=${batch.join("|")}`;
    const json = await getJson<{ entities: Record<string, WdEntity> }>(url);
    for (const [k, v] of Object.entries(json.entities)) out.set(k, v);

  }
  return out;
}

function claimValues(e: WdEntity, p: string): unknown[] {
  const cs = (e.claims?.[p] ?? []).filter((c) => c.rank !== "deprecated" && c.mainsnak.datavalue);
  const preferred = cs.filter((c) => c.rank === "preferred");
  return (preferred.length ? preferred : cs).map((c) => c.mainsnak.datavalue!.value);
}
const qids = (e: WdEntity, p: string) => claimValues(e, p).map((v) => (v as { id: string }).id).filter(Boolean);
const str = (e: WdEntity, p: string) => claimValues(e, p).map((v) => (typeof v === "string" ? v : (v as { text?: string }).text)).filter((v): v is string => !!v);
function timeVal(e: WdEntity, p: string): string | undefined {
  const v = claimValues(e, p)[0] as { time: string; precision: number } | undefined;
  if (!v) return undefined;
  const m = v.time.match(/^([+-])(\d{4,})-(\d{2})-(\d{2})/);
  if (!m || m[1] === "-") return undefined;
  const y = m[2]!.replace(/^0+(?=\d{4})/, "");
  return v.precision >= 11 ? `${y}-${m[3]}-${m[4]}` : v.precision === 10 ? `${y}-${m[3]}` : y;
}
const UNITS: Record<string, string> = { Q11573: "m", Q828224: "km", Q25343: "m²", Q712226: "km²", Q81292: "acres", Q35852: "ha", Q232291: "sq mi", Q3710: "ft", Q253276: "mi" };
function quantity(e: WdEntity, p: string): { value: number; unit?: string } | undefined {
  const v = claimValues(e, p)[0] as { amount: string; unit: string } | undefined;
  if (!v) return undefined;
  const unitQ = v.unit.split("/").pop()!;
  return { value: Number(v.amount), unit: unitQ === "1" ? undefined : UNITS[unitQ] };
}
function coord(e: WdEntity): { lat: number; lon: number } | undefined {
  const v = claimValues(e, "P625")[0] as { latitude: number; longitude: number; globe?: string } | undefined;
  return v && (!v.globe || v.globe.endsWith("Q2")) ? { lat: Math.round(v.latitude * 1e6) / 1e6, lon: Math.round(v.longitude * 1e6) / 1e6 } : undefined;
}

// ---------------------------------------------------------------- Commons + Wikipedia
type CommonsInfo = { url: string; pageUrl: string; license: string; licenseUrl: string; credit: string };
async function commonsInfo(files: string[]): Promise<Map<string, CommonsInfo>> {
  const out = new Map<string, CommonsInfo>();
  const uniq = [...new Set(files)];
  for (let i = 0; i < uniq.length; i += 40) {
    const titles = uniq.slice(i, i + 40).map((f) => `File:${f}`).join("|");
    const url = `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&titles=${encodeURIComponent(titles)}`;
    const json = await getJson<{ query: { normalized?: { from: string; to: string }[]; pages: Record<string, { title: string; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }> } }>(url);
    const back = new Map((json.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(json.query.pages)) {
      const ii = p.imageinfo?.[0];
      const md = ii?.extmetadata ?? {};
      const license = md.LicenseShortName?.value?.trim() ?? "";
      if (!ii || !FREE_LICENSE.test(license)) continue;
      const artist = (md.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "Wikimedia Commons contributor";
      const licenseUrl = md.LicenseUrl?.value || (/public domain|pd/i.test(license) ? "https://creativecommons.org/publicdomain/mark/1.0/" : "https://creativecommons.org/publicdomain/zero/1.0/");
      const original = (back.get(p.title) ?? p.title).replace(/^File:/, "");
      out.set(original.replace(/_/g, " "), { url: (ii.thumburl ?? ii.url).split("?")[0]!, pageUrl: ii.descriptionurl, license, licenseUrl, credit: artist });
    }

  }
  return out;
}

/** Lead sections as plain text, 20 titles per request (MediaWiki TextExtracts limit with exintro). */
async function wikipediaSummaries(titles: string[]): Promise<Map<string, { extract: string; url: string }>> {
  const out = new Map<string, { extract: string; url: string }>();
  const uniq = [...new Set(titles)];
  for (let i = 0; i < uniq.length; i += 20) {
    const batch = uniq.slice(i, i + 20);
    const url = `${WP_API}?action=query&format=json&formatversion=2&prop=extracts|info|pageprops&inprop=url&ppprop=disambiguation&exintro=1&explaintext=1&exlimit=20&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`;
    const j = await getJson<{ query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages?: { title: string; extract?: string; fullurl?: string; missing?: boolean; pageprops?: { disambiguation?: string } }[] } }>(url);
    const alias = new Map<string, string>();
    for (const n of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) alias.set(n.to, n.from);
    for (const p of j.query?.pages ?? []) {
      if (p.missing || !p.extract || p.pageprops?.disambiguation !== undefined) continue;
      // map back through redirect/normalization chains to the requested title
      let requested = p.title;
      for (let k = 0; k < 3 && alias.has(requested); k++) requested = alias.get(requested)!;
      const text = p.extract.trim().split(/\n+/).slice(0, 3).join("\n");
      out.set(requested, { extract: text, url: p.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}` });
    }
  }
  return out;
}

// ---------------------------------------------------------------- main
async function main() {
  const inputs = loadSeedInputs();
  const allAreas = [...inputs.census.areas, ...(inputs.geography?.areas ?? []), ...inputs.curated.neighborhoods];
  const area = allAreas.find((a) => a.slug === areaSlug);
  if (!area) throw new Error(`unknown area ${areaSlug}`);
  // Counties use the detailed 1:500k polygon (the 1:20m display outline clips coasts and barrier islands).
  const shape = loadPlaceGeometry().get(areaSlug) ?? (area.areaType === "county" ? await county500k(area.codes.geoid!) : undefined) ?? loadGeometry().floridaCounties.features.find((f) => f.properties.slug === areaSlug);
  if (!shape) throw new Error(`no boundary polygon for ${areaSlug}`);
  const poly = d3Ready(shape as Feature<Geometry>);
  const [[west, south], [east, north]] = geoBounds(poly);
  const inside = (p: { lat: number; lon: number }) => geoContains(poly, [p.lon, p.lat]);
  const placePolys = [...loadPlaceGeometry().values()].map((f) => ({ slug: f.properties.slug, poly: d3Ready(f as Feature<Geometry>) }));
  const containingPlace = (p: { lat: number; lon: number }) => placePolys.find((x) => geoContains(x.poly, [p.lon, p.lat]))?.slug;
  const retrievedAt = new Date().toISOString();
  console.log(`area ${area.name}: bbox ${south.toFixed(3)},${west.toFixed(3)} – ${north.toFixed(3)},${east.toFixed(3)}`);

  // 1. candidate places (Wikidata, inside bbox, with an English Wikipedia article) + HQ'd organizations
  const areaQid = (area.codes.ansi ? await (async () => {
    const r = await getJson<{ results: { bindings: { item: { value: string } }[] } }>(`${WD_SPARQL}?query=${encodeURIComponent(`SELECT ?item WHERE { ?item wdt:P590 "${String(Number(area.codes.ansi))}" } LIMIT 1`)}`, { headers: { accept: "application/sparql-results+json" } });
    return r.results.bindings[0]?.item.value.split("/").pop();
  })() : undefined);
  const placeQuery = `SELECT DISTINCT ?item WHERE {
    SERVICE wikibase:box { ?item wdt:P625 ?c .
      bd:serviceParam wikibase:cornerSouthWest "Point(${west} ${south})"^^geo:wktLiteral .
      bd:serviceParam wikibase:cornerNorthEast "Point(${east} ${north})"^^geo:wktLiteral . }
    ?wp schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }`;
  const places = await getJson<{ results: { bindings: { item: { value: string } }[] } }>(`${WD_SPARQL}?query=${encodeURIComponent(placeQuery)}`, { headers: { accept: "application/sparql-results+json" } });
  // Two small queries (a combined UNION times out on the public endpoint).
  const sparqlIds = async (where: string) =>
    (await getJson<{ results: { bindings: { item: { value: string } }[] } }>(`${WD_SPARQL}?query=${encodeURIComponent(`SELECT DISTINCT ?item WHERE { ${where} ?wp schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }`)}`, { headers: { accept: "application/sparql-results+json" } }))
      .results.bindings.map((b) => b.item.value.split("/").pop()!);
  const placeIds = places.results.bindings.map((b) => b.item.value.split("/").pop()!);
  const hqIds = new Set(areaQid ? await sparqlIds(`?item wdt:P159 wd:${areaQid} .`) : []);
  // Items stated to be in the area but without coordinates (teams, organizations…); coordinate-bearing ones come from the box query.
  if (areaQid) for (const q of await sparqlIds(`?item wdt:P131 wd:${areaQid} .`)) if (!placeIds.includes(q)) hqIds.add(q);
  const candidateIds = [...new Set([...placeIds, ...hqIds])];
  console.log(`wikidata (${areaQid ?? "no qid"}): ${placeIds.length} items with coordinates in bbox, ${hqIds.size} headquartered / located without coordinates`);

  const ents = await wbget(candidateIds, "labels|descriptions|aliases|claims|sitelinks/urls");
  // class labels
  const classIds = new Set<string>();
  for (const e of ents.values()) for (const c of qids(e, "P31")) classIds.add(c);
  const classes = await wbget([...classIds], "labels");
  const classLabel = (q: string) => classes.get(q)?.labels?.en?.value ?? q;

  // 2. brands present in the area (OpenStreetMap)
  const brandCounts = new Map<string, { n: number; tags: Map<string, number>; byPlace: Map<string, number> }>();
  let osmElements = 0;
  let osmChecksum: string | undefined;
  if (!skipOsm) {
    const q = `[out:json][timeout:180];nwr["brand:wikidata"](${south},${west},${north},${east});out center tags;`;
    type OsmResult = { elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: Record<string, string> }[] };
    let osm: OsmResult | null = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        osm = await getJson<OsmResult>(endpoint, { method: "POST", body: new URLSearchParams({ data: q }).toString(), headers: { "content-type": "application/x-www-form-urlencoded" } }, 3);
        console.log(`openstreetmap: data from ${new URL(endpoint).hostname}`);
        break;
      } catch (err) {
        console.log(`  overpass ${new URL(endpoint).hostname} failed: ${(err as Error).message.slice(0, 60)}`);
      }
    }
    if (!osm) throw new Error("All Overpass endpoints failed; rerun later or use --no-osm");
    osmChecksum = sha256(JSON.stringify(osm));
    for (const el of osm.elements) {
      const p = el.center ?? (el.lat !== undefined ? { lat: el.lat, lon: el.lon! } : undefined);
      if (!p || !inside(p)) continue;
      osmElements++;
      for (const qid of el.tags["brand:wikidata"]!.split(";").map((s) => s.trim()).filter((s) => /^Q\d+$/.test(s))) {
        const rec = brandCounts.get(qid) ?? { n: 0, tags: new Map(), byPlace: new Map() };
        rec.n++;
        const key = el.tags.amenity ? `amenity=${el.tags.amenity}` : el.tags.shop ? `shop=${el.tags.shop}` : ((k) => (k ? `${k}=${el.tags[k]}` : "other"))(Object.keys(el.tags).find((k) => ["leisure", "tourism", "office", "craft"].includes(k)));
        rec.tags.set(key, (rec.tags.get(key) ?? 0) + 1);
        brandCounts.set(qid, rec);
      }
    }
    console.log(`openstreetmap: ${osmElements} branded locations inside ${area.name}, ${brandCounts.size} brands`);
  }
  const brandEnts = await wbget([...brandCounts.keys()].filter((q) => !ents.has(q)), "labels|descriptions|aliases|claims|sitelinks/urls");
  for (const [k, v] of brandEnts) ents.set(k, v);

  // referenced items (operators, owners, venues, leagues, HQ cities…) for labels
  const refIds = new Set<string>();
  for (const e of ents.values()) for (const p of ["P137", "P127", "P115", "P118", "P159", "P112", "P749", "P361", "P1435"]) for (const q of qids(e, p)) refIds.add(q);
  const refs = await wbget([...refIds].filter((q) => !ents.has(q)), "labels");
  const label = (q: string) => ents.get(q)?.labels?.en?.value ?? refs.get(q)?.labels?.en?.value;

  // 3. classify + build records
  const curated = inputs.curated.entities;
  const curatedByName = new Map<string, string>();
  // Curated entries describe Jacksonville/Duval (and a few brands): only match them there, or for brands.
  const curatedScope = ["jacksonville-fl", "duval-county-fl"].includes(areaSlug);
  for (const c of curated) if (curatedScope || c.entityType === "brand") for (const n of [c.name, ...c.aliases]) curatedByName.set(normalize(n), c.slug);
  const records: EnrichedEntity[] = [];
  // Each curated entity is enriched by at most one Wikidata item (first match wins).
  const claimedCurated = new Set<string>();
  const claimCurated = (slug: string | undefined) => (slug && !claimedCurated.has(slug) ? (claimedCurated.add(slug), slug) : undefined);
  const unmapped = new Map<string, number>();
  const excluded = new Map<string, number>();
  // Slugs must be unique statewide: reuse the slug a Q-id already has in another bundle, avoid all others.
  const otherBundles = readdirSync(path.join(SEED_DIR, "generated")).filter((f) => /^enrich-[a-z0-9-]+\.json$/.test(f) && f !== `enrich-${areaSlug}.json`);
  const slugByQid = new Map<string, string>();
  for (const f of otherBundles) for (const e of (JSON.parse(readFileSync(path.join(SEED_DIR, "generated", f), "utf8")) as { entities: { qid: string; slug: string }[] }).entities) slugByQid.set(e.qid, e.slug);
  const usedSlugs = new Set<string>([...curated.map((c) => c.slug), ...allAreas.map((a) => a.slug), ...slugByQid.values()]);
  const pendingSlugs = new Map<string, number>();
  type Draft = Omit<EnrichedEntity, "slug"> & { baseSlug: string };
  const drafts: Draft[] = [];

  for (const [qid, e] of ents) {
    const name = e.labels?.en?.value;
    const wpTitle = e.sitelinks?.enwiki?.title;
    if (!name) continue;
    const isBrand = brandCounts.has(qid);
    const classLabels = qids(e, "P31").map(classLabel);
    const c = coord(e);
    let categories: { slug: string; primary: boolean }[];
    let entityType: string;
    const areas: EnrichedEntity["areas"] = [];
    if (isBrand) {
      const b = brandCounts.get(qid)!;
      const top = [...b.tags.entries()].sort((x, y) => y[1] - x[1])[0]![0];
      const [k, v] = top.split("=");
      const bc = brandCategory({ [k!]: v ?? "" });
      categories = [{ slug: bc.primary, primary: true }, ...(bc.secondary ? [{ slug: bc.secondary, primary: false }] : [])];
      entityType = "brand";
      areas.push({ slug: areaSlug, relation: "operates_in" });
      if (hqIds.has(qid)) areas.push({ slug: areaSlug, relation: "headquartered_in" });
    } else {
      if (!wpTitle) continue;
      if (classLabels.some((l) => EXCLUDE.test(l)) && !classLabels.some((l) => /park|museum|school|stadium|church|building|bridge|airport/i.test(l))) {
        for (const l of classLabels) excluded.set(l, (excluded.get(l) ?? 0) + 1);
        continue;
      }
      const cls = classify(classLabels);
      if (!cls) {
        for (const l of classLabels.length ? classLabels : ["(no class)"]) unmapped.set(l, (unmapped.get(l) ?? 0) + 1);
        continue;
      }
      if (c && !inside(c)) continue; // in the bbox but outside the area polygon
      if (!c && !hqIds.has(qid)) continue;
      categories = [{ slug: cls.rule.category, primary: true }];
      entityType = cls.rule.entityType;
      if (c) areas.push({ slug: containingPlace(c) === areaSlug || !containingPlace(c) ? areaSlug : containingPlace(c)!, relation: "located_in" });
      if (hqIds.has(qid)) areas.push({ slug: areaSlug, relation: "headquartered_in" });
      if (!areas.length) areas.push({ slug: areaSlug, relation: "located_in" });
    }

    const facts: EnrichedEntity["facts"] = [];
    const ref = (p: string) => `${qid} ${p}`;
    const fact = (key: string, value: string | number | undefined, p: string, unit?: string) => {
      if (value !== undefined && value !== "") facts.push({ key, value, unit, sourceId: "wikidata", sourceRef: ref(p) });
    };
    fact("opened", timeVal(e, "P1619"), "P1619");
    fact("inception", timeVal(e, "P571"), "P571");
    fact("closed", timeVal(e, "P576") ?? timeVal(e, "P3999"), "P576");
    const cap = quantity(e, "P1083");
    if (cap) fact("capacity", cap.value, "P1083", "seats");
    const ar = quantity(e, "P2046");
    if (ar) fact("area", ar.value, "P2046", ar.unit);
    const ht = quantity(e, "P2048");
    if (ht && entityType === "building") fact("height", ht.value, "P2048", ht.unit);
    const floors = quantity(e, "P1101");
    if (floors) fact("floors", floors.value, "P1101");
    fact("street-address", str(e, "P6375")[0] ?? str(e, "P969")[0], "P6375");
    for (const [p, key] of [["P137", "operator"], ["P127", "owner"], ["P118", "league"], ["P159", "headquarters"], ["P112", "founded-by"], ["P749", "parent-organization"], ["P1435", "heritage-designation"]] as const) {
      const vals = qids(e, p).map(label).filter((v): v is string => !!v);
      if (vals.length) fact(key, vals.slice(0, 3).join("; "), p);
    }
    const nrhp = str(e, "P649")[0];
    if (nrhp) fact("nrhp-reference", nrhp, "P649");
    const enrollment = quantity(e, "P2196");
    if (enrollment) fact("students", enrollment.value, "P2196");
    const employees = quantity(e, "P1128");
    if (employees && entityType !== "brand") fact("employees", employees.value, "P1128");
    if (isBrand) {
      const b = brandCounts.get(qid)!;
      facts.push({ key: "osm-location-count", value: b.n, unit: "locations", asOf: retrievedAt.slice(0, 10), sourceId: "openstreetmap-overpass", sourceRef: `brand:wikidata=${qid} inside ${area.name} boundary`, scopeAreaSlug: areaSlug });
    }

    const relations: EnrichedEntity["relations"] = [];
    for (const q of qids(e, "P137")) relations.push({ type: "operated_by", targetQid: q });
    for (const q of qids(e, "P115")) relations.push({ type: "home_venue", targetQid: q });
    for (const q of qids(e, "P361")) relations.push({ type: "part_of", targetQid: q });

    const externalIds = [{ provider: "wikidata", id: qid }];
    for (const [p, provider] of [["P238", "iata"], ["P239", "icao"], ["P649", "nrhp"], ["P1566", "geonames"]] as const) {
      const v = str(e, p)[0];
      if (v) externalIds.push({ provider, id: v });
    }
    const dissolved = facts.some((f) => f.key === "closed");
    const isHistorical = classLabels.some((l) => /destroyed|demolished|former|defunct|historical/i.test(l));
    drafts.push({
      qid, name, baseSlug: slugify(name), aliases: (e.aliases?.en ?? []).map((a) => a.value).slice(0, 5),
      description: e.descriptions?.en?.value, entityType, status: dissolved || isHistorical ? "historical" : "active",
      origin: isBrand ? "osm-brand" : "wikidata-place", prominence: 0, categories, areas, coords: isBrand ? undefined : c,
      officialUrl: str(e, "P856")[0]?.replace(/^http:\/\//, "https://"),
      facts, relations, externalIds, media: [],
      curatedSlug: claimCurated(curatedByName.get(normalize(name))),
      wikipedia: wpTitle ? { title: wpTitle, url: e.sitelinks?.enwiki?.url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(wpTitle)}`, extract: "", retrievedAt } : undefined,
    });
  }

  // 3b. Prominence: number of Wikipedia language editions (sitelinks) — an objective "how well known" signal.
  const sitelinks = new Map<string, number>();
  const keptIds = drafts.map((d) => d.qid);
  for (let i = 0; i < keptIds.length; i += 250) {
    const values = keptIds.slice(i, i + 250).map((q) => `wd:${q}`).join(" ");
    const r = await getJson<{ results: { bindings: { item: { value: string }; links: { value: string } }[] } }>(
      `${WD_SPARQL}?query=${encodeURIComponent(`SELECT ?item ?links WHERE { VALUES ?item { ${values} } ?item wikibase:sitelinks ?links . }`)}`,
      { headers: { accept: "application/sparql-results+json" } },
    );
    for (const b of r.results.bindings) sitelinks.set(b.item.value.split("/").pop()!, Number(b.links.value));
  }
  for (const d of drafts) d.prominence = sitelinks.get(d.qid) ?? 0;

  // 4. Wikipedia summaries + Commons media for kept drafts
  const summaries = await wikipediaSummaries(drafts.filter((d) => d.wikipedia).map((d) => d.wikipedia!.title));
  for (const d of drafts) {
    if (!d.wikipedia) continue;
    const s = summaries.get(d.wikipedia.title);
    if (s) {
      d.wikipedia.extract = s.extract;
      d.wikipedia.url = s.url;
    } else d.wikipedia = undefined;
  }
  const imageFor = new Map<string, { file: string; kind: "photo" | "illustration" }>();
  for (const d of drafts) {
    const e = ents.get(d.qid)!;
    const photo = str(e, "P18")[0];
    const logo = str(e, "P154")[0];
    if (d.entityType === "brand" && logo) imageFor.set(d.qid, { file: logo, kind: "illustration" });
    else if (photo) imageFor.set(d.qid, { file: photo, kind: "photo" });
    else if (logo) imageFor.set(d.qid, { file: logo, kind: "illustration" });
  }
  const infos = await commonsInfo([...imageFor.values()].map((v) => v.file));
  let mediaKept = 0;
  for (const d of drafts) {
    const img = imageFor.get(d.qid);
    const info = img ? infos.get(img.file.replace(/_/g, " ")) : undefined;
    if (img && info) {
      mediaKept++;
      d.media.push({ kind: img.kind, url: info.url, pageUrl: info.pageUrl, alt: img.kind === "illustration" ? `${d.name} logo` : `Photograph of ${d.name}`, credit: info.credit, license: info.license, licenseUrl: info.licenseUrl });
    }
  }

  // 5. stable slugs (duplicates within the bundle get a Q-id suffix on every copy)
  for (const d of drafts) pendingSlugs.set(d.baseSlug, (pendingSlugs.get(d.baseSlug) ?? 0) + 1);
  for (const { baseSlug, ...d } of drafts) {
    let slug = d.curatedSlug ?? slugByQid.get(d.qid) ?? baseSlug;
    if (!d.curatedSlug && !slugByQid.has(d.qid) && ((pendingSlugs.get(baseSlug) ?? 0) > 1 || usedSlugs.has(slug) || !slug)) slug = `${baseSlug || "item"}-${d.qid.toLowerCase()}`;
    usedSlugs.add(slug);
    records.push({ ...d, slug });
  }
  // keep only relations whose target is part of the dataset
  const known = new Set(records.map((r) => r.qid));
  for (const r of records) r.relations = r.relations.filter((x) => known.has(x.targetQid) && x.targetQid !== r.qid);

  const sources: Source[] = [
    { id: "wikidata", kind: "reference", title: "Wikidata", publisher: "Wikimedia Foundation (community-edited)", url: "https://www.wikidata.org/", license: "CC0 1.0 (public domain dedication)", termsUrl: "https://www.wikidata.org/wiki/Wikidata:Licensing", redisplayPermitted: true, coverage: "Structured data on notable entities", expectedFields: ["P31", "P625", "P571", "P1619", "P137", "P127", "P1083", "P856", "P18"], retrievalMethod: "Wikidata API (wbgetentities) and SPARQL", refreshInterval: "Quarterly", limitations: "Community-edited secondary source. Values are shown as imported, not verified.", retrievedAt },
    { id: "wikipedia-en", kind: "reference", title: "English Wikipedia (lead summaries)", publisher: "Wikimedia Foundation (community-written)", url: "https://en.wikipedia.org/", license: "CC BY-SA 4.0 — text shown verbatim with attribution and a link to the article", termsUrl: "https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content", redisplayPermitted: true, coverage: "Articles on notable entities", expectedFields: ["summary"], retrievalMethod: "Wikimedia REST API page/summary", refreshInterval: "Quarterly", limitations: "Encyclopedic summary, not a primary source. It may lag behind recent changes.", retrievedAt },
    ...(skipOsm ? [] : [{ id: "openstreetmap-overpass", kind: "dataset" as const, title: "OpenStreetMap — branded locations (brand:wikidata)", publisher: "OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", license: "ODbL 1.0 — © OpenStreetMap contributors", termsUrl: "https://osmfoundation.org/wiki/Licence", redisplayPermitted: true, coverage: `Mapped shops, restaurants, fuel stations and services tagged with a brand inside ${area.name}`, expectedFields: ["brand:wikidata", "amenity", "shop"], retrievalMethod: "Overpass API (single bounding-box query, filtered to the area boundary)", refreshInterval: "Monthly", limitations: "Counts mapped locations only; OSM can be incomplete or out of date. Not an official store count.", retrievedAt, checksumSha256: osmChecksum }]),
  ];

  const stats: Record<string, number | string> = {
    area: areaSlug, wikidataCandidates: candidateIds.length, places: records.filter((r) => r.origin === "wikidata-place").length,
    brands: records.filter((r) => r.origin === "osm-brand").length, enrichCurated: records.filter((r) => r.curatedSlug).length,
    withWikipediaSummary: records.filter((r) => r.wikipedia).length, withFreeImage: mediaKept, withCoordinates: records.filter((r) => r.coords).length,
    osmBrandedLocations: osmElements, unmappedClasses: unmapped.size,
  };
  console.table(stats);
  console.log(`requests: ${liveRequests} live, ${cacheHits} from cache`);
  console.log("top unmapped classes:", [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([l, n]) => `${l} (${n})`).join(", "));
  console.log("categories:", Object.entries(records.reduce<Record<string, number>>((m, r) => ((m[r.categories[0]!.slug] = (m[r.categories[0]!.slug] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", "));

  const bundle = enrichmentBundleSchema.parse({ generatedAt: retrievedAt, generator: "scripts/ingest/enrich-area.ts", areaSlug, sources, entities: records, stats });
  if (hasFlag("--dry-run")) return console.log("dry run: nothing written");
  writeJson(path.join(SEED_DIR, "generated", `enrich-${areaSlug}.json`), bundle);
  console.log(`wrote seed/generated/enrich-${areaSlug}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

