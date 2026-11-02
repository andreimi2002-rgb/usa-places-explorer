/**
 * Builds src/data/imported/listings.json — the statewide "basic listings".
 *
 *   npm run import:wikidata
 *
 * Data comes from Wikidata (CC0) and photo credits from Wikimedia Commons.
 * Nothing is written by hand here: the site turns these records into short
 * template text, and every value links back to its Wikidata item.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { EXCLUDED, GROUPS, IMPORT_DATE, STATES } from './config.mjs';
import {
  all, attachPhotos, classQuery, countyAt, entities, inBox, isClosed, parsePoint, qid, recordFields, sleep, sparql,
} from './lib.mjs';

const OUT = new URL('../../src/data/imported/listings.json', import.meta.url);

// Places that already have a full profile are never imported again.
const sourcesTs = readFileSync(new URL('../../src/data/sources.ts', import.meta.url), 'utf8');
const EXCLUDE = new Set([
  ...[...sourcesTs.matchAll(/'(Q\d+)'/g)].map((m) => m[1]),
  ...Object.keys(EXCLUDED),
]);

// Asking "is it inside this state?" over the whole admin hierarchy is too slow
// for every U.S. item, so we pre-filter by a rough box and confirm the state
// only for the shortlisted items.
const stateCheckQuery = (ids) => `
SELECT ?item ?state WHERE {
  VALUES ?item { ${ids.map((i) => 'wd:' + i).join(' ')} }
  VALUES ?state { ${STATES.map((s) => 'wd:' + s.qid).join(' ')} }
  ?item wdt:P131* ?state .
}`;

// Generous boxes (lat/lng); the state check settles the overlaps.
const BOXES = {
  FL: [24.3, 31.1, -87.7, -79.8],
  TX: [25.8, 36.6, -106.7, -93.4],
  AZ: [31.3, 37.1, -114.9, -109.0],
  CA: [32.5, 42.1, -124.5, -114.1],
};
const STATE_NAMES = { FL: 'Florida', TX: 'Texas', AZ: 'Arizona', CA: 'California' };

// Step 1: ranked candidates per group and state.
const picked = [];
const seen = new Set();
const stateOfQid = Object.fromEntries(STATES.map((s) => [s.qid, s.code]));
for (const g of GROUPS) {
  const rows = (await sparql(classQuery(g.classes, { minSitelinks: g.minSitelinks ?? 0 })))
    .map((r) => ({ id: qid(r.item.value), sl: Number(r.sl.value), pt: parsePoint(r.coord.value) }))
    .filter((r) => r.pt && !EXCLUDE.has(r.id) && !seen.has(r.id))
    .sort((x, y) => y.sl - x.sl);
  const shortlist = new Map();
  for (const s of STATES) {
    for (const r of rows.filter((r) => inBox(r.pt, BOXES[s.code])).slice(0, g.cap * 4 + 20)) shortlist.set(r.id, r);
  }
  const confirmed = new Map();
  const ids = [...shortlist.keys()];
  for (let i = 0; i < ids.length; i += 150) {
    for (const r of await sparql(stateCheckQuery(ids.slice(i, i + 150)))) confirmed.set(qid(r.item.value), stateOfQid[qid(r.state.value)]);
    await sleep(500);
  }
  const counts = [];
  for (const s of STATES) {
    let kept = 0;
    for (const r of rows) {
      if (kept >= g.cap * 3) break; // trimmed to the cap after re-ranking below
      if (confirmed.get(r.id) !== s.code || seen.has(r.id)) continue;
      seen.add(r.id);
      picked.push({ id: r.id, group: g, state: s.code });
      kept++;
    }
    counts.push(`${s.code} ${kept}`);
  }
  console.log(`${g.typeId.padEnd(22)} ${counts.join('  ')}`);
  await sleep(800);
}

// Step 2: entity details.
console.log(`\nFetching details for ${picked.length} items…`);
const ent = await entities(picked.map((p) => p.id));

// Labels for "located in" places (city or county).
const locIds = new Set();
for (const p of picked) for (const c of all(ent[p.id]?.claims, 'P131')) locIds.add(c.mainsnak.datavalue.value.id);
const locEnt = await entities([...locIds], 'labels');
function pickLocality(claims, stateCode) {
  const named = all(claims, 'P131')
    .map((c) => locEnt[c.mainsnak.datavalue.value.id]?.labels?.en?.value)
    .filter((l) => l && l !== STATE_NAMES[stateCode]);
  return named.find((l) => !/County$/.test(l)) ?? named[0] ?? null;
}

const records = [];
const dropped = {};
const drop = (why) => { dropped[why] = (dropped[why] ?? 0) + 1; };
for (const p of picked) {
  const e = ent[p.id];
  if (!e || e.missing !== undefined) { drop('not fetched'); continue; }
  if (isClosed(e)) { drop('closed'); continue; }
  const f = recordFields(e);
  if (!f.name || f.lat === null || !f.imageFile || !f.wikipedia) { drop('missing name/coord/photo/article'); continue; }
  let city = pickLocality(e.claims, p.state);
  if (!city) {
    // Wikidata only says "in <state>": look up the county from the coordinates.
    const county = await countyAt(f.lat, f.lng);
    if (!county || county.state !== p.state) { drop('no city or county'); continue; }
    city = county.name;
  }
  const { qid: id, name, ...rest } = f;
  records.push({ qid: id, name, typeId: p.group.typeId, state: p.state, city, ...rest });
}

// Keep the top places per type and state by the re-ranked count.
{
  const byKey = new Map();
  for (const r of records) {
    const k = r.typeId + '|' + r.state;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }
  const caps = Object.fromEntries(GROUPS.map((g) => [g.typeId, g.cap]));
  const keep = new Set();
  for (const [k, list] of byKey) {
    list.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name));
    for (const r of list.slice(0, caps[k.split('|')[0]])) keep.add(r.qid);
  }
  for (let i = records.length - 1; i >= 0; i--) if (!keep.has(records[i].qid)) records.splice(i, 1);
}

const withPhoto = await attachPhotos(records);
mkdirSync(new URL('.', OUT), { recursive: true });
console.log('dropped:', dropped);
writeFileSync(OUT, JSON.stringify({ importedOn: IMPORT_DATE, records }, null, 1) + '\n');
console.log(`\n${records.length} listings, ${withPhoto} with a usable photo → src/data/imported/listings.json`);
