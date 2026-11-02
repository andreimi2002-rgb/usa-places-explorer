/**
 * Builds src/data/imported/region-<id>.json — in-depth listings for a region
 * (e.g. Greater Orlando): every notable place of the configured classes,
 * with no cap per type.
 *
 *   npm run import:region -- orlando
 *
 * Places already in the statewide listings or with a full profile are skipped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { EXCLUDED, GROUPS, IMPORT_DATE, REGIONS, REGION_GROUPS } from './config.mjs';
import {
  attachPhotos, classQuery, countyAt, entities, inBox, isClosed, parsePoint, qid, recordFields, sleep, sparql,
} from './lib.mjs';

const region = REGIONS.find((r) => r.id === process.argv[2]);
if (!region) throw new Error(`Unknown region "${process.argv[2]}". Known: ${REGIONS.map((r) => r.id).join(', ')}`);
const OUT = new URL(`../../src/data/imported/region-${region.id}.json`, import.meta.url);

const sourcesTs = readFileSync(new URL('../../src/data/sources.ts', import.meta.url), 'utf8');
const statewide = JSON.parse(readFileSync(new URL('../../src/data/imported/listings.json', import.meta.url), 'utf8'));
const EXCLUDE = new Set([
  ...[...sourcesTs.matchAll(/'(Q\d+)'/g)].map((m) => m[1]),
  ...Object.keys(EXCLUDED),
  ...statewide.records.map((r) => r.qid),
]);

const groups = [
  ...REGION_GROUPS.filter((g) => g.first),
  ...GROUPS,
  ...REGION_GROUPS.filter((g) => !g.first),
];
const picked = [];
const seen = new Set();
for (const g of groups) {
  const rows = (await sparql(classQuery(g.classes, { requireImage: false })))
    .map((r) => ({ id: qid(r.item.value), pt: parsePoint(r.coord.value) }))
    .filter((r) => r.pt && inBox(r.pt, region.box) && !EXCLUDE.has(r.id) && !seen.has(r.id));
  let kept = 0;
  for (const r of rows) {
    const county = await countyAt(r.pt[0], r.pt[1]);
    if (!county || !region.countyFips.includes(county.fips)) continue;
    seen.add(r.id);
    picked.push({ id: r.id, typeId: g.typeId, county: county.name });
    kept++;
  }
  console.log(`${g.typeId.padEnd(22)} ${kept}`);
  await sleep(500);
}

console.log(`\nFetching details for ${picked.length} items…`);
const ent = await entities(picked.map((p) => p.id), 'labels|descriptions|claims|sitelinks');
const records = [];
const dropped = {};
const drop = (why) => { dropped[why] = (dropped[why] ?? 0) + 1; };
for (const p of picked) {
  const e = ent[p.id];
  if (!e || e.missing !== undefined) { drop('not fetched'); continue; }
  if (isClosed(e)) { drop('closed'); continue; }
  const f = recordFields(e);
  if (!f.name || f.lat === null || !f.wikipedia) { drop('missing name/coord/article'); continue; }
  // Never-built or cancelled projects often lack an end date in Wikidata.
  if (/cancel|unbuilt|never (built|opened|constructed)|proposed|planned/i.test(e.descriptions?.en?.value ?? '')) { drop('never built'); continue; }
  // No obscure places: a visitor-facing place with a photo or an official
  // website, or anything covered by more than one Wikipedia.
  const visitorFacing = region.visitorTypes.includes(p.typeId) && (f.imageFile || f.website);
  if (!visitorFacing && f.sitelinks < region.minSitelinks) { drop('too obscure'); continue; }
  const { qid: id, name, ...rest } = f;
  // City is filled in from the Census geocoder (scripts/geo); county for now.
  records.push({ qid: id, name, typeId: p.typeId, state: region.state, city: p.county, region: region.id, ...rest });
}

const withPhoto = await attachPhotos(records);
console.log('dropped:', dropped);
writeFileSync(OUT, JSON.stringify({ importedOn: IMPORT_DATE, region: region.id, records }, null, 1) + '\n');
console.log(`\n${records.length} listings, ${withPhoto} with a usable photo → src/data/imported/region-${region.id}.json`);
