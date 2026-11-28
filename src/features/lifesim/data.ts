import { readFileSync } from "node:fs";
import path from "node:path";
import type { TaxTable } from "./engine/tax";
import type { CarClass, EducationLevel, GameActivity, GameCar, GameData, GameEmployer, GameMetro, GameSpecies, GameSpot, GameTeam } from "./engine/types";
import { commonsThumb } from "@/lib/media";

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

// ------------------------------------------------------------------ game snapshot for /play

type EducationFile = { occupations: Record<string, { title: string; education: string; experience: string }> };
type RentsFile = { metros: Record<string, { monthly: GameMetro["rent"] }> };
type LifeTableFile = { ages: { age: number; male: { q: number }; female: { q: number } }[] };
type ActivityRec = GameActivity & { prominence: number; distanceKm?: number | Record<string, number> };
type ActivitiesFile = { local: Record<string, ActivityRec[]>; statewide: (ActivityRec & { distanceKm: Record<string, number> })[] };
type OutdoorsFile = { licenses: { fishingFreshwater: { annualCost: number }; hunting: { annualCost: number }; hunterSafety: { requiredIfBornAfter: number } }; species: GameSpecies[]; spots: (GameSpot & { metro: string })[] };

type LocalFile = { employers: Record<string, GameEmployer[]>; teams: Record<string, GameTeam[]>; cars: GameCar[]; carRunningCosts: Record<CarClass, { insurance: number; fuel: number }> };

const EDU: Record<string, EducationLevel> = {
  "No formal educational credential": 0,
  "High school diploma or equivalent": 1,
  "Some college, no degree": 2,
  "Postsecondary nondegree award": 3,
  "Associate's degree": 4,
  "Bachelor's degree": 5,
  "Master's degree": 6,
  "Doctoral or professional degree": 7,
};
const EXPERIENCE: Record<string, number> = { None: 0, "Less than 5 years": 2, "5 years or more": 5 };
/** Game estimate of non-rent living costs relative to the average of the six metros. */
const COST_INDEX: Record<string, number> = { jacksonville: 0.97, orlando: 1.0, miami: 1.12, tampa: 1.02, destin: 1.0, tallahassee: 0.94 };
const JOBS_PER_METRO = 240;
const TRIPS = 14;

const thumb = (a: ActivityRec): GameActivity => ({
  slug: a.slug, name: a.name, kind: a.kind, category: a.category, image: a.image ? commonsThumb(a.image, 330) : null,
  blurb: a.blurb, effects: a.effects, costBand: a.costBand,
});

export function buildGameData(): GameData {
  const wages = loadWages();
  const hur = loadHurricanes();
  const edu = load<EducationFile>("education.json").occupations;
  const rents = load<RentsFile>("rents.json").metros;
  const lt = load<LifeTableFile>("life-table.json").ages;
  const acts = load<ActivitiesFile>("activities.json");
  const out = load<OutdoorsFile>("outdoors.json");
  const local = load<LocalFile>("local.json");

  const metros: GameMetro[] = GAME_METROS.map((gm) => {
    const jobs = wages.metros[gm.slug]!.occupations
      .filter((o) => o.group === "detailed" && edu[o.soc] && [o.annual.p10, o.annual.p25, o.annual.p50, o.annual.p75].every((v) => v !== null))
      .sort((a, b) => (b.employment ?? 0) - (a.employment ?? 0))
      .slice(0, JOBS_PER_METRO)
      .map((o) => ({
        soc: o.soc, title: o.title, employment: o.employment ?? 0,
        wage: { p10: o.annual.p10!, p25: o.annual.p25!, p50: o.annual.p50!, p75: o.annual.p75!, p90: o.annual.p90 ?? Math.round(o.annual.p75! * 1.3) },
        education: EDU[edu[o.soc]!.education] ?? 1,
        experienceYears: EXPERIENCE[edu[o.soc]!.experience] ?? 0,
      }));
    const trips = acts.statewide
      .map((t) => ({ ...thumb(t), distanceKm: t.distanceKm[gm.slug] }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, TRIPS);
    return {
      slug: gm.slug, name: gm.name, tagline: gm.tagline, jobs,
      rent: rents[gm.slug]!.monthly,
      hurricaneAnnualProbability: hur.metros[gm.slug]!.annualProbability,
      activities: (acts.local[gm.slug] ?? []).map(thumb),
      trips,
      spots: out.spots.filter((s) => s.metro === gm.slug).map((s) => ({ name: s.name, habitats: s.habitats, region: s.region, distanceKm: s.distanceKm })),
      costIndex: COST_INDEX[gm.slug] ?? 1,
      employers: local.employers[gm.slug] ?? [],
      teams: local.teams[gm.slug] ?? [],
    };
  });

  const taxes = loadTaxes();
  return {
    version: "0.1",
    metros,
    lifeTable: { male: lt.map((r) => r.male.q), female: lt.map((r) => r.female.q) },
    taxes,
    species: out.species.map((s) => ({ sci: s.sci, common: s.common, mode: s.mode, habitats: s.habitats, regions: s.regions, rarity: s.rarity, note: s.note, wikipedia: s.wikipedia })),
    licenses: { fishing: out.licenses.fishingFreshwater.annualCost, hunting: out.licenses.hunting.annualCost, hunterSafetyBornAfter: out.licenses.hunterSafety.requiredIfBornAfter },
    cars: local.cars,
    carRunningCosts: local.carRunningCosts,
    sources: [
      { label: "Wages: BLS OEWS May 2024", url: wages.source.url },
      { label: "Entry education: BLS Employment Projections", url: "https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm" },
      { label: "Rents: HUD Fair Market Rents FY2026", url: "https://www.huduser.gov/portal/datasets/fmr.html" },
      { label: "Taxes: IRS tax year 2026", url: taxes.federalIncomeTax.source.url },
      { label: "Mortality: SSA period life table 2023", url: "https://www.ssa.gov/oact/STATS/table4c6.html" },
      { label: "Hurricanes: NOAA HURDAT2 1950–2025", url: hur.source.url },
      { label: "Places and species: Wikidata", url: "https://www.wikidata.org/" },
    ],
  };
}
