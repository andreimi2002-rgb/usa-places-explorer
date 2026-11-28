/**
 * Life sim data: yearly hurricane odds per metro from NOAA HURDAT2 (Atlantic best tracks).
 * For each metro anchor point we find storms that came within 140 km (~75 nm) while at hurricane
 * strength (status HU), 1950–2025, and record the strongest category nearby. Yearly odds =
 * years with at least one such storm / years in the window. Output: seed/lifesim/hurricanes.json
 */
import path from "node:path";
import { acquire, SEED_DIR, writeJson } from "../ingest/lib";
import { haversineKm } from "../../src/lib/data/fixture-provider";
import { loadSeedInputs } from "../../src/lib/data/inputs";
import { METROS } from "./metros";

const URL_HURDAT = "https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2025-02272026.txt";
const RADIUS_KM = 140;
const FROM = 1950;
const TO = 2025;
const KT_TO_CAT = (kt: number) => (kt >= 137 ? 5 : kt >= 113 ? 4 : kt >= 96 ? 3 : kt >= 83 ? 2 : kt >= 64 ? 1 : 0);

const parseCoord = (s: string) => {
  const v = Number(s.slice(0, -1));
  return /[SW]$/.test(s) ? -v : v;
};

async function main() {
  const d = await acquire("noaa", URL_HURDAT);
  const lines = d.bytes.toString("utf8").split(/\r?\n/);
  type Fix = { year: number; lat: number; lon: number; status: string; kt: number };
  const storms: { id: string; name: string; fixes: Fix[] }[] = [];
  for (const line of lines) {
    const p = line.split(",").map((x) => x.trim());
    if (/^AL\d{6}$/.test(p[0] ?? "")) storms.push({ id: p[0]!, name: p[1]!, fixes: [] });
    else if (p.length > 7 && storms.length) {
      const year = Number(p[0]!.slice(0, 4));
      storms.at(-1)!.fixes.push({ year, status: p[3]!, lat: parseCoord(p[4]!), lon: parseCoord(p[5]!), kt: Number(p[6]) });
    }
  }
  const places = loadSeedInputs().census.areas;
  const out: Record<string, unknown> = {};
  for (const m of METROS) {
    const a = places.find((x) => x.slug === m.anchorPlace);
    if (!a?.internalPoint) throw new Error(`no anchor point for ${m.anchorPlace}`);
    const hits = new Map<number, { storm: string; year: number; category: number }[]>();
    for (const s of storms) {
      const near = s.fixes.filter((f) => f.year >= FROM && f.year <= TO && f.status === "HU" && haversineKm(a.internalPoint!.lat, a.internalPoint!.lon, f.lat, f.lon) <= RADIUS_KM);
      if (!near.length) continue;
      const year = near[0]!.year;
      const category = Math.max(...near.map((f) => KT_TO_CAT(f.kt)));
      hits.set(year, [...(hits.get(year) ?? []), { storm: `${s.name} (${s.id})`, year, category }]);
    }
    const years = TO - FROM + 1;
    const all = [...hits.values()].flat();
    const byCat = [1, 2, 3, 4, 5].map((c) => all.filter((h) => h.category === c).length);
    out[m.slug] = {
      anchor: { slug: a.slug, lat: a.internalPoint.lat, lon: a.internalPoint.lon },
      window: `${FROM}-${TO}`, radiusKm: RADIUS_KM,
      yearsWithHurricane: hits.size, annualProbability: Math.round((hits.size / years) * 1000) / 1000,
      stormsByCategory: { cat1: byCat[0], cat2: byCat[1], cat3: byCat[2], cat4: byCat[3], cat5: byCat[4] },
      storms: all.sort((x, y) => x.year - y.year),
    };
    console.log(`${m.name.padEnd(13)} ${String(hits.size).padStart(3)} hurricane years / ${years} → ${(hits.size / years * 100).toFixed(1)}%/yr   major (cat3+): ${byCat[2]! + byCat[3]! + byCat[4]!}`);
  }
  writeJson(path.join(SEED_DIR, "lifesim", "hurricanes.json"), {
    source: { id: "noaa-hurdat2", title: "NOAA NHC HURDAT2 Atlantic best-track data (1851–2025)", url: URL_HURDAT, license: "Public domain (U.S. federal government work); credit NOAA National Hurricane Center", retrievedAt: d.retrievedAt, checksumSha256: d.sha256,
      method: `Storms at hurricane status within ${RADIUS_KM} km of the metro anchor point, ${FROM}–${TO}. Category = strongest 6-hourly intensity inside the radius.` },
    metros: out,
  });
  console.log("wrote seed/lifesim/hurricanes.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
