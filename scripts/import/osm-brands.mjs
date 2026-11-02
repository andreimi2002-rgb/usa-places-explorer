/**
 * Builds src/data/imported/osm-brands-<region>.json: locations of the atlas's
 * brands inside a city area, from OpenStreetMap (ODbL, credited on the site).
 *
 *   npm run import:osm-brands -- orlando
 *
 * Only the main store or travel-center feature is kept (not separate fuel
 * stations, tire centers or car washes), and only inside the area's counties.
 */
import { writeFileSync } from 'node:fs';
import { IMPORT_DATE, REGIONS } from './config.mjs';
import { countyAt, sleep, UA } from './lib.mjs';

const region = REGIONS.find((r) => r.id === process.argv[2]);
if (!region) throw new Error(`Unknown region "${process.argv[2]}"`);
const OUT = new URL(`../../src/data/imported/osm-brands-${region.id}.json`, import.meta.url);

/** Brand Wikidata ID → atlas brand and place type, plus which OSM features count as the main location. */
const BRANDS = {
  Q715583: { brandId: 'brand-costco', typeId: 'warehouse-club', label: 'Costco', main: (t) => t.shop === 'wholesale' },
  Q4867953: { brandId: 'brand-bass-pro-shops', typeId: 'outdoor-superstore', label: 'Bass Pro Shops', main: (t) => t.shop === 'outdoor' },
  Q1872496: { brandId: 'brand-loves', typeId: 'travel-center', label: "Love's Travel Stop", main: (t) => t.shop === 'convenience' || /Travel Stop/.test(t.name ?? '') },
  Q1434601: { brandId: 'brand-pilot-flying-j', typeId: 'travel-center', label: 'Pilot Flying J', main: (t) => t.shop === 'convenience' },
  Q4982335: { brandId: 'brand-bucees', typeId: 'travel-center', label: "Buc-ee's", main: (t) => t.shop === 'convenience' },
};

const [s, n, w, e] = region.box;
const query = `[out:json][timeout:90];
(nwr["brand:wikidata"~"^(${Object.keys(BRANDS).join('|')})$"](${s},${w},${n},${e}););
out center tags;`;

let elements;
for (const endpoint of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (r.ok) { elements = (await r.json()).elements; break; }
  console.warn(`  ${endpoint}: ${r.status}`);
  await sleep(5000);
}
if (!elements) throw new Error('Overpass failed');

const records = [];
for (const el of elements) {
  const t = el.tags ?? {};
  const brand = BRANDS[t['brand:wikidata']];
  if (!brand || !brand.main(t)) continue;
  const lat = el.center?.lat ?? el.lat;
  const lng = el.center?.lon ?? el.lon;
  const county = await countyAt(lat, lng);
  if (!county || !region.countyFips.includes(county.fips)) continue;
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const town = t['addr:city'] ?? null;
  records.push({
    osm: `${el.type}/${el.id}`,
    brandWikidata: t['brand:wikidata'],
    brandId: brand.brandId,
    typeId: brand.typeId,
    name: [t.name && t.name !== brand.label ? t.name : brand.label, t.branch ?? town].filter(Boolean).join(' '),
    state: region.state,
    city: town ?? county.name,
    county: county.name,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    address: street && town ? `${street}, ${town}, ${region.state}${t['addr:postcode'] ? ' ' + t['addr:postcode'].slice(0, 5) : ''}` : null,
    website: t.website ?? null,
  });
}

records.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(OUT, JSON.stringify({ importedOn: IMPORT_DATE, region: region.id, records }, null, 1) + '\n');
console.log(`${records.length} brand locations → src/data/imported/osm-brands-${region.id}.json`);
for (const r of records) console.log(`  ${r.name} | ${r.address ?? '-'} | ${r.county}`);
