/**
 * Builds src/data/imported/listings.json — the "basic listings" layer.
 *
 *   node scripts/import/wikidata-listings.mjs
 *
 * Data comes from Wikidata (CC0) and photo credits from Wikimedia Commons.
 * Nothing is written by hand here: the site turns these records into short
 * template text, and every value links back to its Wikidata item.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { EXCLUDED, GROUPS, IMPORT_DATE, STATES } from './config.mjs';

const UA = { 'User-Agent': 'USAPlacesExplorer/0.1 (data import; andreimi2002@gmail.com)' };
const OUT = new URL('../../src/data/imported/listings.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Places that already have a full profile are never imported again.
const sourcesTs = readFileSync(new URL('../../src/data/sources.ts', import.meta.url), 'utf8');
const EXCLUDE = new Set([
  ...[...sourcesTs.matchAll(/'(Q\d+)'/g)].map((m) => m[1]),
  ...Object.keys(EXCLUDED),
]);

async function sparql(query) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: { ...UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'query=' + encodeURIComponent(query),
    });
    if (r.ok) return (await r.json()).results.bindings;
    console.warn(`  SPARQL ${r.status}, retry ${attempt}`);
    await sleep(5000 * attempt);
  }
  throw new Error('SPARQL failed after retries');
}

// Step 1 (SPARQL). Asking "is it inside this state?" over the whole admin
// hierarchy is too slow on the public endpoint, so we fetch every U.S. item of
// the class (fast), pre-filter by a rough state box, then confirm the state
// only for the shortlisted items.
const classQuery = (classes, minSitelinks) => `
SELECT ?item (MAX(?s) AS ?sl) (SAMPLE(?c) AS ?coord) WHERE {
  VALUES ?cls { ${classes.map((c) => 'wd:' + c).join(' ')} }
  ?item wdt:P31 ?cls ; wdt:P17 wd:Q30 ; wdt:P625 ?c ; wdt:P18 [] ; wikibase:sitelinks ?s .
  FILTER(?s >= ${minSitelinks})
  ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  FILTER NOT EXISTS { ?item wdt:P576 [] }
} GROUP BY ?item`;

const stateCheckQuery = (ids) => `
SELECT ?item ?state WHERE {
  VALUES ?item { ${ids.map((i) => 'wd:' + i).join(' ')} }
  VALUES ?state { ${STATES.map((s) => 'wd:' + s.qid).join(' ')} }
  ?item wdt:P131* ?state .
}`;

// Generous boxes (lat/lng); the state check above settles the overlaps.
const BOXES = {
  FL: [24.3, 31.1, -87.7, -79.8],
  TX: [25.8, 36.6, -106.7, -93.4],
  AZ: [31.3, 37.1, -114.9, -109.0],
  CA: [32.5, 42.1, -124.5, -114.1],
};
const inBox = ([lat, lng], [a, b, c, d]) => lat >= a && lat <= b && lng >= c && lng <= d;
const parsePoint = (wkt) => {
  const m = wkt.match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/);
  return m ? [Number(m[2]), Number(m[1])] : null;
};

// Step 2 (Wikidata API): full entity data, 50 items per request.
async function entities(ids, props = 'labels|claims|sitelinks') {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const url = `https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&languages=en&props=${props}&ids=${ids.slice(i, i + 50).join('|')}`;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await fetch(url, { headers: UA });
      if (r.ok) { Object.assign(out, (await r.json()).entities); break; }
      await sleep(3000 * attempt);
    }
    await sleep(300);
  }
  return out;
}

const qid = (uri) => uri.split('/').pop();
const STATE_NAMES = { FL: 'Florida', TX: 'Texas', AZ: 'Arizona', CA: 'California' };
const best = (claims, p) => {
  const list = (claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak.datavalue);
  return list.find((c) => c.rank === 'preferred') ?? list[0];
};
const all = (claims, p) => (claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak.datavalue);

// Collect ranked candidates per group and state.
const picked = [];
const seen = new Set();
const stateOfQid = Object.fromEntries(STATES.map((s) => [s.qid, s.code]));
for (const g of GROUPS) {
  const rows = (await sparql(classQuery(g.classes, g.minSitelinks ?? 0)))
    .map((r) => ({ id: qid(r.item.value), sl: Number(r.sl.value), pt: parsePoint(r.coord.value) }))
    .filter((r) => r.pt && !EXCLUDE.has(r.id) && !seen.has(r.id))
    .sort((x, y) => y.sl - x.sl);
  // Shortlist per state by box, then confirm the state.
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
      picked.push({ id: r.id, group: g, state: s.code, sitelinks: r.sl });
      kept++;
    }
    counts.push(`${s.code} ${kept}`);
  }
  console.log(`${g.typeId.padEnd(22)} ${counts.join('  ')}`);
  await sleep(800);
}

console.log(`
Fetching details for ${picked.length} items…`);
const ent = await entities(picked.map((p) => p.id));

// Labels for "located in" places (city or county).
const locIds = new Set();
for (const p of picked) for (const c of all(ent[p.id]?.claims, 'P131')) locIds.add(c.mainsnak.datavalue.value.id);
const locEnt = await entities([...locIds], 'labels|claims');
function pickLocality(claims, stateCode) {
  const locs = all(claims, 'P131').map((c) => locEnt[c.mainsnak.datavalue.value.id]).filter(Boolean);
  const named = locs.map((e) => ({ e, label: e.labels?.en?.value })).filter((l) => l.label && l.label !== STATE_NAMES[stateCode]);
  const isCounty = (l) => /County$/.test(l.label);
  return (named.find((l) => !isCounty(l)) ?? named[0])?.label ?? null;
}

// Some Wikipedias (Cebuano, Swedish, Waray…) hold millions of bot-made stubs,
// which inflate the count for obscure places. Leave them out of the ranking.
const BOT_WIKIS = new Set(['cebwiki', 'svwiki', 'warwiki', 'arzwiki', 'azbwiki', 'nlwiki', 'vowiki', 'commonswiki', 'specieswiki']);
const humanSitelinks = (e) => Object.keys(e.sitelinks ?? {}).filter((k) => k.endsWith('wiki') && !BOT_WIKIS.has(k)).length;

/** County for a point, from the FCC Census Area API (U.S. government). */
async function countyAt(lat, lng) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`, { headers: UA });
    await sleep(250);
    if (!r.ok) { await sleep(2000 * attempt); continue; }
    const hit = (await r.json()).results?.[0];
    return hit ? { name: hit.county_name, state: hit.state_code } : null;
  }
  return null;
}

const records = [];
const dropped = {};
const drop = (why) => { dropped[why] = (dropped[why] ?? 0) + 1; };
for (const p of picked) {
  const e = ent[p.id];
  if (!e || e.missing !== undefined) { drop('not fetched'); continue; }
  if (all(e.claims, 'P3999').length || all(e.claims, 'P576').length) { drop('closed'); continue; }
  if (all(e.claims, 'P5817').some((c) => c.mainsnak.datavalue.value.id === 'Q56556915')) { drop('demolished'); continue; }
  const name = e.labels?.en?.value;
  const coord = best(e.claims, 'P625')?.mainsnak.datavalue.value;
  const image = best(e.claims, 'P18')?.mainsnak.datavalue.value;
  const wp = e.sitelinks?.enwiki?.title;
  if (!name || !coord || !image || !wp) { drop('missing name/coord/photo/article'); continue; }
  let city = pickLocality(e.claims, p.state);
  if (!city) {
    // Wikidata only says "in <state>": look up the county from the coordinates.
    const county = await countyAt(coord.latitude, coord.longitude);
    if (!county || county.state !== p.state) { drop('no city or county'); continue; }
    city = county.name;
  }
  const inc = best(e.claims, 'P571')?.mainsnak.datavalue.value;
  let year = null;
  if (inc && inc.precision >= 9 && inc.time.startsWith('+')) {
    const y = Number(inc.time.slice(1, 5));
    if (y > 1000 && y <= 2026) year = y;
  }
  const addr = all(e.claims, 'P6375').find((c) => c.mainsnak.datavalue.value.language === 'en')?.mainsnak.datavalue.value.text ?? null;
  const nrhp = all(e.claims, 'P1435').some((c) => c.mainsnak.datavalue.value.id === 'Q19558910');
  records.push({
    qid: p.id,
    name,
    typeId: p.group.typeId,
    state: p.state,
    city,
    lat: Number(coord.latitude.toFixed(5)),
    lng: Number(coord.longitude.toFixed(5)),
    sitelinks: humanSitelinks(e),
    wikipedia: wp,
    year,
    website: best(e.claims, 'P856')?.mainsnak.datavalue.value ?? null,
    address: addr,
    nrhp,
    imageFile: image,
  });
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

// ---------------------------------------------------------------------------
// Commons photo credits (author, license, size), 50 files per request.
// ---------------------------------------------------------------------------
const LICENSES = [
  [/^cc0/i, 'CC0'], [/public domain|^pd/i, 'Public domain'],
  [/^cc by-sa 4\.0/i, 'CC BY-SA 4.0'], [/^cc by-sa 3\.0/i, 'CC BY-SA 3.0'], [/^cc by-sa 2\.5/i, 'CC BY-SA 2.5'], [/^cc by-sa 2\.0/i, 'CC BY-SA 2.0'],
  [/^cc by 4\.0/i, 'CC BY 4.0'], [/^cc by 3\.0/i, 'CC BY 3.0'], [/^cc by 2\.5/i, 'CC BY 2.5'], [/^cc by 2\.0/i, 'CC BY 2.0'],
  [/^attribution$/i, 'Attribution'],
];
const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

const files = [...new Set(records.map((r) => r.imageFile))];
const meta = new Map();
for (let i = 0; i < files.length; i += 50) {
  const titles = files.slice(i, i + 50).map((f) => 'File:' + f).join('|');
  let j;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch('https://commons.wikimedia.org/w/api.php', {
      method: 'POST',
      headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1280', titles }),
    });
    if (r.ok) { j = await r.json(); break; }
    await sleep(4000 * attempt);
  }
  const norm = new Map((j.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const p of Object.values(j.query.pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata ?? {};
    const licenseName = m.LicenseShortName?.value ?? '';
    const license = LICENSES.find(([re]) => re.test(licenseName.trim()))?.[1];
    const author = strip(m.Artist?.value);
    if (!license || !author) continue; // unclear credit → no photo
    let authorUrl = (m.Artist?.value.match(/href="([^"]+)"/) ?? [])[1] ?? null;
    if (authorUrl?.startsWith('//')) authorUrl = 'https:' + authorUrl;
    if (authorUrl?.includes('redlink=1')) authorUrl = null;
    const big = ii.width > 1280;
    const scale = big ? 1280 / ii.width : 1;
    const title = (norm.get(p.title) ?? p.title).replace(/^File:/, '').replace(/_/g, ' ');
    meta.set(title, {
      fileUrl: (big ? ii.thumburl : ii.url).split('?')[0].replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/'),
      commonsPageUrl: ii.descriptionurl,
      author: author.slice(0, 120),
      authorUrl,
      license,
      licenseUrl: m.LicenseUrl?.value?.replace(/^http:/, 'https:') ?? null,
      width: Math.round(ii.width * scale),
      height: Math.round(ii.height * scale),
    });
  }
  await sleep(1000);
}

let withPhoto = 0;
for (const r of records) {
  const m = meta.get(r.imageFile);
  r.image = m ?? null;
  if (m) withPhoto++;
  delete r.imageFile;
}

mkdirSync(new URL('.', OUT), { recursive: true });
console.log('dropped:', dropped);
writeFileSync(OUT, JSON.stringify({ importedOn: IMPORT_DATE, records }, null, 1) + '\n');
console.log(`\n${records.length} listings, ${withPhoto} with a usable photo → src/data/imported/listings.json`);
