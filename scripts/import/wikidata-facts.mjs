/**
 * Builds src/data/imported/facts.json: extra sourced facts for every imported
 * listing, read from its Wikidata item (capacity, tenants, architect, height,
 * visitors and so on). Each fact is shown on the site with the Wikidata item
 * as its source.
 *
 *   npm run import:facts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { all, entities, sleep } from './lib.mjs';

const OUT = new URL('../../src/data/imported/facts.json', import.meta.url);
const files = ['listings.json', 'region-orlando.json'].map((f) =>
  JSON.parse(readFileSync(new URL(`../../src/data/imported/${f}`, import.meta.url), 'utf8')),
);
const qids = [...new Set(files.flatMap((f) => f.records.map((r) => r.qid)))];

const nf = new Intl.NumberFormat('en-US');
const round = (n, d = 0) => Number(n.toFixed(d));

// Units: Wikidata unit item → [label, to-imperial conversion].
const UNITS = {
  Q11573: { label: 'm', imperial: (v) => `${nf.format(round(v * 3.28084))} ft` },
  Q828224: { label: 'km', imperial: (v) => `${nf.format(round(v * 0.621371, 1))} mi` },
  Q3710: { label: 'ft' },
  Q253276: { label: 'mi' },
  Q25343: { label: 'm²', imperial: (v) => `${nf.format(round(v / 4046.86, 1))} acres` },
  Q712226: { label: 'km²', imperial: (v) => `${nf.format(round(v * 0.386102, 1))} sq mi` },
  Q35852: { label: 'hectares', imperial: (v) => `${nf.format(round(v * 2.47105))} acres` },
  Q81292: { label: 'acres' },
  Q232291: { label: 'sq mi' },
};

function quantity(dv) {
  const amount = Number(dv.amount);
  const unit = UNITS[dv.unit?.split('/').pop()];
  if (!Number.isFinite(amount) || amount <= 0 || !unit) return null;
  const main = `${nf.format(round(amount, amount < 10 ? 1 : 0))} ${unit.label}`;
  return unit.imperial ? `${main} (${unit.imperial(amount)})` : main;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function date(t) {
  if (!t?.time?.startsWith('+')) return null;
  const [y, m, d] = t.time.slice(1, 11).split('-').map(Number);
  if (t.precision >= 11 && m && d) return `${MONTHS[m - 1]} ${d}, ${y}`;
  if (t.precision === 10 && m) return `${MONTHS[m - 1]} ${y}`;
  if (t.precision === 9) return String(y);
  return null;
}

const current = (c) => !c.qualifiers?.P582; // no end time → still true
const yearOf = (c) => {
  const q = c.qualifiers?.P585?.[0]?.datavalue?.value;
  return q?.time ? Number(q.time.slice(1, 5)) : null;
};

/** The facts we read, in display order. */
const PROPS = [
  { p: 'P1619', label: 'Opened', kind: 'date' },
  { p: 'P466', label: 'Home to', kind: 'items', max: 3, currentOnly: true },
  { p: 'P1083', label: 'Capacity', kind: 'count' },
  { p: 'P1174', label: 'Visitors per year', kind: 'count', latest: true },
  { p: 'P2196', label: 'Students', kind: 'count', latest: true },
  { p: 'P1082', label: 'Population', kind: 'count', latest: true },
  { p: 'P2048', label: 'Height', kind: 'quantity' },
  { p: 'P2043', label: 'Length', kind: 'quantity' },
  { p: 'P2046', label: 'Area', kind: 'quantity' },
  { p: 'P2044', label: 'Elevation', kind: 'quantity' },
  { p: 'P206', label: 'On the water of', kind: 'items', max: 2 },
  { p: 'P84', label: 'Architect', kind: 'items', max: 2 },
  { p: 'P149', label: 'Architectural style', kind: 'items', max: 2 },
  { p: 'P127', label: 'Owner', kind: 'items', max: 2, currentOnly: true },
  { p: 'P137', label: 'Operator', kind: 'items', max: 2, currentOnly: true },
  { p: 'P1435', label: 'Heritage status', kind: 'items', max: 3, skip: ['Q19558910'] },
  { p: 'P138', label: 'Named after', kind: 'items', max: 2 },
];

console.log(`Reading ${qids.length} items…`);
const ent = await entities(qids, 'claims');

// Labels for every item-valued fact.
const refIds = new Set();
for (const id of qids) {
  for (const { p, kind } of PROPS) {
    if (kind !== 'items') continue;
    for (const c of all(ent[id]?.claims, p)) refIds.add(c.mainsnak.datavalue.value.id);
  }
}
const labels = await entities([...refIds], 'labels');
const label = (id) => labels[id]?.labels?.en?.value;

const out = {};
let total = 0;
for (const id of qids) {
  const claims = ent[id]?.claims;
  if (!claims) continue;
  const facts = [];
  for (const prop of PROPS) {
    let list = all(claims, prop.p);
    if (prop.currentOnly) list = list.filter(current);
    if (!list.length) continue;
    let value = null;
    let asOfYear = null;
    if (prop.kind === 'date') value = date(list[0].mainsnak.datavalue.value);
    if (prop.kind === 'quantity') value = quantity(list[0].mainsnak.datavalue.value);
    if (prop.kind === 'count') {
      const pick = prop.latest ? [...list].sort((a, b) => (yearOf(b) ?? 0) - (yearOf(a) ?? 0))[0] : list[0];
      const n = Number(pick.mainsnak.datavalue.value.amount);
      if (Number.isFinite(n) && n > 0) {
        asOfYear = yearOf(pick);
        value = nf.format(n) + (asOfYear ? ` (${asOfYear})` : '');
      }
    }
    if (prop.kind === 'items') {
      const names = list
        .map((c) => c.mainsnak.datavalue.value.id)
        .filter((q) => !(prop.skip ?? []).includes(q))
        .map(label)
        .filter((n) => n && !/^Q\d+$/.test(n));
      const unique = [...new Set(names)].slice(0, prop.max);
      if (unique.length) value = unique.join(', ');
    }
    if (value) facts.push({ label: prop.label, value, ...(asOfYear ? { asOfYear } : {}) });
  }
  if (facts.length) {
    out[id] = facts;
    total += facts.length;
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`${Object.keys(out).length} of ${qids.length} listings got ${total} facts → src/data/imported/facts.json`);
await sleep(0);
