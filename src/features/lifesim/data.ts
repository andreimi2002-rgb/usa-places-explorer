import { readFileSync } from "node:fs";
import path from "node:path";
import type { TaxTable } from "./engine/tax";

/** Server-only loaders for the life sim data snapshots (seed/lifesim/*.json). */

export type Pct = { p10: number | null; p25: number | null; p50: number | null; p75: number | null; p90: number | null; mean: number | null };
export type Occupation = { soc: string; title: string; group: "total" | "major" | "detailed"; employment: number | null; annual: Pct; hourly: Pct; annualTopCoded: boolean; hourlyOnly: boolean };
export type WagesFile = { source: { title: string; url: string; referencePeriod: string; license: string }; metros: Record<string, { cbsa: string; areaTitle: string; occupations: Occupation[] }> };
export type HurricaneMetro = { annualProbability: number; yearsWithHurricane: number; window: string; radiusKm: number; stormsByCategory: Record<string, number>; storms: { storm: string; year: number; category: number }[] };
export type HurricanesFile = { source: { title: string; url: string; method: string }; metros: Record<string, HurricaneMetro> };

export const GAME_METROS = [
  { slug: "jacksonville", name: "Jacksonville", tagline: "Port city on the St. Johns River" },
  { slug: "orlando", name: "Orlando", tagline: "Theme parks and the I-4 corridor" },
  { slug: "miami", name: "Miami", tagline: "Global city, high cost of living" },
  { slug: "tampa", name: "Tampa", tagline: "Bay, beaches and a big job market" },
  { slug: "destin", name: "Destin", tagline: "Emerald Coast, tourism and Eglin AFB" },
  { slug: "tallahassee", name: "Tallahassee", tagline: "The capital: state government and two universities" },
] as const;

const cache = new Map<string, unknown>();
function load<T>(file: string): T {
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(path.join(process.cwd(), "seed", "lifesim", file), "utf8")));
  return cache.get(file) as T;
}

export const loadWages = () => load<WagesFile>("wages.json");
export const loadHurricanes = () => load<HurricanesFile>("hurricanes.json");
export const loadTaxes = () => load<TaxTable & { federalIncomeTax: { source: { title: string; url: string } } }>("taxes.json");

/** Detailed occupations reported in every game metro, most common first (by total employment). */
export function sharedOccupations(w: WagesFile): { soc: string; title: string; employment: number }[] {
  const metros = GAME_METROS.map((m) => w.metros[m.slug]!);
  const counts = new Map<string, { title: string; n: number; employment: number }>();
  for (const m of metros)
    for (const o of m.occupations) {
      if (o.group !== "detailed" || o.annual.p50 === null) continue;
      const c = counts.get(o.soc) ?? { title: o.title, n: 0, employment: 0 };
      c.n++;
      c.employment += o.employment ?? 0;
      counts.set(o.soc, c);
    }
  return [...counts.entries()]
    .filter(([, c]) => c.n === metros.length)
    .map(([soc, c]) => ({ soc, title: c.title, employment: c.employment }))
    .sort((a, b) => b.employment - a.employment);
}
