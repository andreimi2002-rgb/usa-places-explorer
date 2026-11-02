/**
 * Shared helpers for the Wikidata import scripts.
 * Data: Wikidata (CC0), Commons (photo credits), FCC Census Area API (county).
 */
export const UA = { 'User-Agent': 'USAPlacesExplorer/0.1 (data import; andreimi2002@gmail.com)' };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const qid = (uri) => uri.split('/').pop();

export async function sparql(query) {
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

/**
 * Every U.S. item of the given classes that has coordinates and an English
 * Wikipedia article (fast: no admin-hierarchy walk).
 */
export const classQuery = (classes, { minSitelinks = 0, requireImage = true } = {}) => `
SELECT ?item (MAX(?s) AS ?sl) (SAMPLE(?c) AS ?coord) WHERE {
  VALUES ?cls { ${classes.map((c) => 'wd:' + c).join(' ')} }
  ?item wdt:P31 ?cls ; wdt:P17 wd:Q30 ; wdt:P625 ?c ; wikibase:sitelinks ?s .
  ${requireImage ? '?item wdt:P18 [] .' : ''}
  FILTER(?s >= ${minSitelinks})
  ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  FILTER NOT EXISTS { ?item wdt:P576 [] }
} GROUP BY ?item`;

export const parsePoint = (wkt) => {
  const m = wkt.match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/);
  return m ? [Number(m[2]), Number(m[1])] : null;
};
export const inBox = ([lat, lng], [a, b, c, d]) => lat >= a && lat <= b && lng >= c && lng <= d;

/** Full entity data from the Wikidata API, 50 items per request. */
export async function entities(ids, props = 'labels|claims|sitelinks') {
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

export const best = (claims, p) => {
  const list = (claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak.datavalue);
  return list.find((c) => c.rank === 'preferred') ?? list[0];
};
export const all = (claims, p) => (claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak.datavalue);

// Some Wikipedias (Cebuano, Swedish, Waray…) hold millions of bot-made stubs,
// which inflate the count for obscure places. Leave them out of the ranking.
const BOT_WIKIS = new Set(['cebwiki', 'svwiki', 'warwiki', 'arzwiki', 'azbwiki', 'nlwiki', 'vowiki', 'commonswiki', 'specieswiki']);
export const humanSitelinks = (e) => Object.keys(e.sitelinks ?? {}).filter((k) => k.endsWith('wiki') && !BOT_WIKIS.has(k)).length;

export const isClosed = (e) =>
  all(e.claims, 'P3999').length > 0 ||
  all(e.claims, 'P576').length > 0 ||
  all(e.claims, 'P5817').some((c) => c.mainsnak.datavalue.value.id === 'Q56556915');

/** County for a point, from the FCC Census Area API (U.S. government). */
export async function countyAt(lat, lng) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`, { headers: UA });
    await sleep(250);
    if (!r.ok) { await sleep(2000 * attempt); continue; }
    const hit = (await r.json()).results?.[0];
    return hit ? { name: hit.county_name, fips: hit.county_fips, state: hit.state_code } : null;
  }
  return null;
}

/** The record fields shared by every import (everything but type/state/city). */
export function recordFields(e) {
  const coord = best(e.claims, 'P625')?.mainsnak.datavalue.value;
  const inc = best(e.claims, 'P571')?.mainsnak.datavalue.value;
  let year = null;
  if (inc && inc.precision >= 9 && inc.time.startsWith('+')) {
    const y = Number(inc.time.slice(1, 5));
    if (y > 1000 && y <= 2026) year = y;
  }
  return {
    qid: e.id,
    name: e.labels?.en?.value ?? null,
    lat: coord ? Number(coord.latitude.toFixed(5)) : null,
    lng: coord ? Number(coord.longitude.toFixed(5)) : null,
    sitelinks: humanSitelinks(e),
    wikipedia: e.sitelinks?.enwiki?.title ?? null,
    year,
    website: best(e.claims, 'P856')?.mainsnak.datavalue.value ?? null,
    address: all(e.claims, 'P6375').find((c) => c.mainsnak.datavalue.value.language === 'en')?.mainsnak.datavalue.value.text ?? null,
    nrhp: all(e.claims, 'P1435').some((c) => c.mainsnak.datavalue.value.id === 'Q19558910'),
    imageFile: best(e.claims, 'P18')?.mainsnak.datavalue.value ?? null,
  };
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

/** Replaces each record's `imageFile` with `image` (credit data) or null. */
export async function attachPhotos(records) {
  const files = [...new Set(records.map((r) => r.imageFile).filter(Boolean))];
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
      const license = LICENSES.find(([re]) => re.test((m.LicenseShortName?.value ?? '').trim()))?.[1];
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
    r.image = (r.imageFile && meta.get(r.imageFile)) || null;
    if (r.image) withPhoto++;
    delete r.imageFile;
  }
  return withPhoto;
}
