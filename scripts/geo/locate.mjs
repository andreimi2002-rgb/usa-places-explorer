/**
 * Looks up the official locality (incorporated city/town, or census-designated
 * place) and county for every place with coordinates, using the U.S. Census
 * Bureau geocoder. Results are cached in src/data/geo/place-geo.json, so only
 * new places are looked up on later runs.
 *
 *   npm run geo:locate
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const OUT = new URL('../../src/data/geo/place-geo.json', import.meta.url);
const UA = { 'User-Agent': 'USAPlacesExplorer/0.1 (geocoding; andreimi2002@gmail.com)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LAYERS = 'Incorporated Places,Census Designated Places,Counties';

async function lookup(lat, lng) {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=${encodeURIComponent(LAYERS)}&format=json`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) {
        const g = (await r.json()).result?.geographies ?? {};
        const inc = g['Incorporated Places']?.[0];
        const cdp = g['Census Designated Places']?.[0];
        const county = g.Counties?.[0];
        const strip = (n) => n.replace(/ (city|town|village|CDP)$/i, '');
        return {
          locality: inc ? strip(inc.NAME) : cdp ? strip(cdp.NAME) : null,
          localityKind: inc ? 'incorporated' : cdp ? 'cdp' : null,
          county: county?.NAME ?? null,
          countyFips: county?.GEOID ?? null,
        };
      }
    } catch { /* network hiccup: retry */ }
    await sleep(2000 * attempt);
  }
  return null;
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { allPlaces } = await server.ssrLoadModule('/src/data/all.ts');
  const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { source: 'U.S. Census Bureau Geocoder (Current benchmark)', places: {} };
  const todo = allPlaces.filter((p) => p.lat !== null && p.lng !== null && !cache.places[p.id]);
  mkdirSync(new URL('.', OUT), { recursive: true });
  console.log(`${allPlaces.length} places, ${todo.length} to look up`);
  let n = 0;
  for (const p of todo) {
    const hit = await lookup(p.lat, p.lng);
    if (hit) cache.places[p.id] = hit;
    if (++n % 50 === 0) {
      console.log(`  ${n}/${todo.length}`);
      writeFileSync(OUT, JSON.stringify(cache, null, 1) + '\n');
    }
    await sleep(150);
  }
  writeFileSync(OUT, JSON.stringify(cache, null, 1) + '\n');
  console.log(`done: ${Object.keys(cache.places).length} places located`);
} finally {
  await server.close();
}
