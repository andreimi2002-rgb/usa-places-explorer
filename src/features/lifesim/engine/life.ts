/**
 * America 360: Life — the game engine. Pure functions over a serializable `Life`.
 * Real data: wages (BLS OEWS), entry education (BLS EP), rents (HUD FMR FY2026), taxes (IRS TY2026),
 * mortality (SSA period life table), hurricane odds (NOAA HURDAT2), places/species (Wikidata).
 * Everything else here (event odds, costs not covered by a source, stat effects) is a GAME ASSUMPTION;
 * those constants are grouped in `ASSUME` so they are easy to audit and replace with sourced values.
 */
import { Rng } from "./rng";
import { takeHomePay } from "./tax";
import type { EducationLevel, GameActivity, GameData, GameJob, GameMetro, GameSpot, Life, Lifestyle, LogEntry, Stats } from "./types";
import { EDUCATION_LABELS } from "./types";

export const START_YEAR = 2026;
export const ACTIONS_PER_YEAR = 4;

/** Game assumptions (not sourced). Dollar amounts are 2026 estimates. */
export const ASSUME = {
  livingCostRenting: 15000, // food, transport, phone, insurance for a single adult, per year
  livingCostWithParents: 4500,
  /** Share of discretionary money (take-home minus rent and basics) spent, by lifestyle. */
  lifestyleShare: { frugal: 0.5, normal: 0.82, lavish: 1.05 } as const,
  lifestyleMood: { frugal: -3, normal: 0, lavish: 3 } as const,
  employerHealthSaving: 2000, // employer coverage lowers out-of-pocket health spending
  debtInterest: 0.07,
  activityCost: { free: 0, low: 15, medium: 75, high: 160 } as const,
  tripCostPerKm: 0.12, // gas and wear, round trip counted twice
  tripLodging: 180,
  movingCost: 2000,
  gymCost: 40,
  doctorVisitInsured: 60,
  doctorVisitUninsured: 250,
  erBillUninsured: 3000,
  erBillInsured: 500,
  charterShare: 180,
  fishingTripCost: 30,
  huntingTripCost: 60,
  hunterSafetyCourse: 25,
  nightOutCost: 80,
  duiTotalCost: 7500, // fines, court costs, lawyer, insurance increase (first offense, rough)
  tuition: { certificate: 3500, associate: 3200, bachelor: 6400, master: 10500, doctoral: 26000 },
  brightFuturesSmarts: 75, // stand-in for the GPA/test-score thresholds
  reemploymentWeekly: 275, // Florida Reemployment Assistance maximum weekly benefit
  reemploymentWeeks: 12,
} as const;

const UNIVERSITY: Record<string, string> = {
  jacksonville: "University of North Florida",
  orlando: "University of Central Florida",
  miami: "Florida International University",
  tampa: "University of South Florida",
  destin: "University of West Florida",
  tallahassee: "Florida State University",
};
const COLLEGE: Record<string, string> = {
  jacksonville: "Florida State College at Jacksonville",
  orlando: "Valencia College",
  miami: "Miami Dade College",
  tampa: "Hillsborough Community College",
  destin: "Northwest Florida State College",
  tallahassee: "Tallahassee State College",
};

export type Result = { life: Life; ok: boolean; message: string };

// ------------------------------------------------------------------ helpers
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const fmtMoney = money;

function clone(l: Life): Life {
  return JSON.parse(JSON.stringify(l)) as Life;
}
function log(l: Life, text: string, tone: LogEntry["tone"] = "neutral") {
  l.log.push({ year: l.year, age: l.age, text, tone });
  if (l.log.length > 600) l.log.splice(0, l.log.length - 600);
}
function bump(l: Life, s: Partial<Stats>) {
  for (const [k, v] of Object.entries(s) as [keyof Stats, number][]) l.stats[k] = Math.round(clamp(l.stats[k] + v));
}
function spend(l: Life, amount: number) {
  l.cash -= amount;
  l.spentThisYear += amount;
}
export function metroOf(data: GameData, l: Life): GameMetro {
  return data.metros.find((m) => m.slug === l.metro) ?? data.metros[0]!;
}
const insured = (l: Life) => !!l.job;
function fail(l: Life, message: string): Result {
  return { life: l, ok: false, message };
}
function act(l: Life, message: string, tone: LogEntry["tone"] = "neutral"): Result {
  log(l, message, tone);
  return { life: l, ok: true, message };
}
/** Clone + seeded RNG for an action; the caller must call `done` to persist RNG state. */
function begin(life: Life, needsAction = true): { l: Life; rng: Rng; err?: string } {
  const l = clone(life);
  if (!l.alive) return { l, rng: new Rng(l.rngState), err: "This life is over." };
  if (needsAction && l.actionsLeft <= 0) return { l, rng: new Rng(l.rngState), err: "No time left this year. Age up to continue." };
  return { l, rng: new Rng(l.rngState) };
}
function done(l: Life, rng: Rng, usesAction = true) {
  l.rngState = rng.state;
  if (usesAction) l.actionsLeft--;
}

// ------------------------------------------------------------------ new life
export function newLife(data: GameData, opts: { name: string; gender: "male" | "female"; metro: string; seed: number }): Life {
  const rng = new Rng(opts.seed);
  const stats: Stats = { vitality: rng.int(55, 90), mood: rng.int(45, 80), smarts: rng.int(30, 90), drive: rng.int(30, 85), charisma: rng.int(30, 85) };
  const metro = data.metros.find((m) => m.slug === opts.metro) ?? data.metros[0]!;
  const l: Life = {
    seed: opts.seed, rngState: rng.state, name: opts.name.trim() || "Alex Rivera", gender: opts.gender,
    birthYear: START_YEAR - 18, year: START_YEAR, age: 18, metro: metro.slug, alive: true,
    stats, education: 1, study: null, job: null, workYears: 0, cash: rng.int(400, 2500), debt: 0,
    home: { kind: "parents" }, actionsLeft: ACTIONS_PER_YEAR, lastYear: null, spentThisYear: 0, log: [], visited: [],
    licenses: { fishing: null, hunting: null }, hunterSafety: false, lifeList: {}, conditions: [], record: { arrests: 0, tickets: 0 },
    retirementIncome: 0, brightFutures: stats.smarts >= ASSUME.brightFuturesSmarts, lifestyle: "normal",
  };
  log(l, `You turn 18 in ${metro.name}, Florida. High school is behind you; you still live with your parents.`, "neutral");
  if (l.brightFutures) log(l, "Your grades and test scores qualify you for the Florida Bright Futures scholarship (tuition at Florida public colleges).", "good");
  return l;
}

// ------------------------------------------------------------------ jobs
export type JobCheck = { ok: boolean; reason?: string; odds: number };
export function jobCheck(l: Life, j: GameJob): JobCheck {
  if (l.age < 18) return { ok: false, reason: "Too young", odds: 0 };
  if (l.education < j.education) return { ok: false, reason: `Requires ${EDUCATION_LABELS[j.education]}`, odds: 0 };
  if (l.workYears < j.experienceYears) return { ok: false, reason: `Requires ${j.experienceYears}+ years of work experience`, odds: 0 };
  const competitive = j.wage.p50 > 100000 ? 0.15 : j.wage.p50 > 70000 ? 0.07 : 0;
  const odds = clamp(0.55 + (l.stats.charisma - 50) / 200 + (l.stats.smarts - 50) / 300 + Math.min(0.15, (l.workYears - j.experienceYears) * 0.02) - competitive - l.record.arrests * 0.1, 0.05, 0.95);
  return { ok: true, odds };
}

export function applyForJob(data: GameData, life: Life, soc: string): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const j = metroOf(data, l).jobs.find((x) => x.soc === soc);
  if (!j) return fail(l, "That job is not available here.");
  const c = jobCheck(l, j);
  if (!c.ok) return fail(l, c.reason!);
  if (!rng.chance(c.odds)) {
    done(l, rng);
    bump(l, { mood: -3 });
    return act(l, `You applied to be a ${j.title} and interviewed, but they went with another candidate.`, "bad");
  }
  // offer: entry near p10–p25, experienced near p50–p75 (real wage distribution of this metro)
  const exp = Math.min(1, l.workYears / 12);
  const lo = j.wage.p10 + (j.wage.p50 - j.wage.p10) * exp;
  const hi = j.wage.p25 + (j.wage.p75 - j.wage.p25) * exp;
  const salary = Math.round(rng.range(lo, hi) / 100) * 100;
  if (l.job) log(l, `You quit your job as ${l.job.title}.`);
  l.job = { soc: j.soc, title: j.title, salary, years: 0, performance: 55 };
  done(l, rng);
  bump(l, { mood: 6 });
  return act(l, `Hired! You are now a ${j.title} earning ${money(salary)} a year (local median for this job: ${money(j.wage.p50)}).`, "good");
}

export function quitJob(life: Life): Result {
  const { l, rng, err } = begin(life, false);
  if (err) return fail(l, err);
  if (!l.job) return fail(l, "You don't have a job.");
  const t = l.job.title;
  l.job = null;
  done(l, rng, false);
  return act(l, `You quit your job as ${t}.`);
}

export function workHarder(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (!l.job) return fail(l, "You don't have a job.");
  l.job.performance = clamp(l.job.performance + rng.int(6, 14));
  bump(l, { mood: -2, vitality: -1, drive: 1 });
  done(l, rng);
  return act(l, "You put in long hours. Your boss noticed.", "good");
}

export function askForRaise(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (!l.job) return fail(l, "You don't have a job.");
  const p = clamp(0.15 + (l.job.performance - 50) / 80 + (l.stats.charisma - 50) / 200, 0.05, 0.85);
  done(l, rng);
  if (rng.chance(p)) {
    const pct = rng.int(3, 8);
    l.job.salary = Math.round((l.job.salary * (1 + pct / 100)) / 100) * 100;
    bump(l, { mood: 5 });
    return act(l, `You asked for a raise and got ${pct}%. New salary: ${money(l.job.salary)}.`, "good");
  }
  l.job.performance = clamp(l.job.performance - 5);
  bump(l, { mood: -3 });
  return act(l, "You asked for a raise. Your manager said \"not this year.\"", "bad");
}

// ------------------------------------------------------------------ education
export type Program = { id: string; label: string; target: EducationLevel; years: number; tuition: number; requires: EducationLevel; minSmarts: number };
export function programs(l: Life): Program[] {
  const uni = UNIVERSITY[l.metro] ?? "a state university";
  const col = COLLEGE[l.metro] ?? "a state college";
  const bachelorYears = l.education >= 4 ? 2 : 4;
  return [
    { id: "cert", label: `Technical certificate at ${col}`, target: 3, years: 1, tuition: ASSUME.tuition.certificate, requires: 1, minSmarts: 0 },
    { id: "aa", label: `Associate's degree at ${col}`, target: 4, years: 2, tuition: ASSUME.tuition.associate, requires: 1, minSmarts: 0 },
    { id: "ba", label: `Bachelor's degree at ${uni}${bachelorYears === 2 ? " (transfer, 2 years)" : ""}`, target: 5, years: bachelorYears, tuition: ASSUME.tuition.bachelor, requires: 1, minSmarts: 45 },
    { id: "ma", label: `Master's degree at ${uni}`, target: 6, years: 2, tuition: ASSUME.tuition.master, requires: 5, minSmarts: 55 },
    { id: "phd", label: "Professional degree (law or medicine)", target: 7, years: 4, tuition: ASSUME.tuition.doctoral, requires: 5, minSmarts: 72 },
  ].filter((p) => p.target > l.education) as Program[];
}

export function enroll(life: Life, id: string): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (l.study) return fail(l, "You are already enrolled.");
  const p = programs(l).find((x) => x.id === id);
  if (!p) return fail(l, "That program is not available.");
  if (l.education < p.requires) return fail(l, `Requires ${EDUCATION_LABELS[p.requires]}.`);
  done(l, rng);
  if (l.stats.smarts < p.minSmarts && !rng.chance(0.25)) {
    bump(l, { mood: -4 });
    return act(l, `${p.label}: application rejected. Raising your smarts would help.`, "bad");
  }
  const covered = l.brightFutures && p.target <= 5;
  l.study = { target: p.target, label: p.label, yearsLeft: p.years, tuitionPerYear: covered ? 0 : p.tuition };
  bump(l, { mood: 3 });
  return act(l, `Accepted: ${p.label}.${covered ? " Bright Futures covers your tuition." : ` Tuition about ${money(p.tuition)} a year.`}`, "good");
}

export function dropOut(life: Life): Result {
  const { l, rng, err } = begin(life, false);
  if (err) return fail(l, err);
  if (!l.study) return fail(l, "You are not enrolled.");
  const label = l.study.label;
  if (l.education < 2) l.education = 2;
  l.study = null;
  done(l, rng, false);
  return act(l, `You dropped out of ${label}.`, "bad");
}

// ------------------------------------------------------------------ housing & moving
export const BEDROOMS = [
  { bedrooms: 0 as const, key: "studio" as const, label: "Studio" },
  { bedrooms: 1 as const, key: "br1" as const, label: "1-bedroom" },
  { bedrooms: 2 as const, key: "br2" as const, label: "2-bedroom" },
  { bedrooms: 3 as const, key: "br3" as const, label: "3-bedroom" },
];
export function rentCheck(l: Life, monthly: number): { ok: boolean; reason?: string } {
  const income = l.job?.salary ?? 0;
  if (income >= monthly * 36) return { ok: true };
  if (l.cash >= monthly * 12) return { ok: true };
  return { ok: false, reason: `Landlords want income of 3× rent (${money(monthly * 36)}/yr) or a year of rent in savings.` };
}
export function rentHome(data: GameData, life: Life, bedrooms: 0 | 1 | 2 | 3): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const b = BEDROOMS.find((x) => x.bedrooms === bedrooms)!;
  const monthly = metroOf(data, l).rent[b.key];
  const c = rentCheck(l, monthly);
  if (!c.ok) return fail(l, c.reason!);
  spend(l, monthly); // security deposit; first month is part of the year's housing cost
  const first = l.home.kind === "parents";
  l.home = { kind: "rent", bedrooms, monthlyRent: monthly };
  bump(l, { mood: first ? 8 : 3 });
  done(l, rng);
  return act(l, `You signed a lease on a ${b.label.toLowerCase()} apartment in ${metroOf(data, l).name}: ${money(monthly)}/month (security deposit paid).`, "good");
}
export function moveBackHome(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (l.home.kind === "parents") return fail(l, "You already live with your parents.");
  l.home = { kind: "parents" };
  bump(l, { mood: l.age > 25 ? -6 : -2 });
  done(l, rng);
  return act(l, "You moved back in with your parents to save money.");
}
export function moveCity(data: GameData, life: Life, metro: string): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const to = data.metros.find((m) => m.slug === metro);
  if (!to || to.slug === l.metro) return fail(l, "Pick a different city.");
  const bedrooms = l.home.kind === "rent" ? (Math.min(l.home.bedrooms, 3) as 0 | 1 | 2 | 3) : 0;
  const key = BEDROOMS.find((b) => b.bedrooms === bedrooms)!.key;
  const monthly = to.rent[key];
  const need = ASSUME.movingCost + monthly;
  if (l.cash < need) return fail(l, `Moving to ${to.name} needs about ${money(need)} (movers + deposit). You have ${money(l.cash)}.`);
  spend(l, need);
  const lostJob = l.job?.title;
  l.job = null;
  if (l.study) {
    log(l, `You withdrew from ${l.study.label}.`, "bad");
    if (l.education < 2) l.education = 2;
    l.study = null;
  }
  const from = metroOf(data, l).name;
  l.metro = to.slug;
  l.home = { kind: "rent", bedrooms, monthlyRent: monthly };
  bump(l, { mood: 4 });
  done(l, rng);
  return act(l, `You moved from ${from} to ${to.name}. ${lostJob ? `You left your job as ${lostJob}. ` : ""}New place: ${money(monthly)}/month.`, "good");
}

// ------------------------------------------------------------------ activities, health, social
export function activityCost(a: GameActivity): number {
  if (a.kind === "trip") {
    const d = a.distanceKm ?? 100;
    return Math.round(d * 2 * ASSUME.tripCostPerKm + (d > 150 ? ASSUME.tripLodging : 0) + 35);
  }
  return ASSUME.activityCost[a.costBand];
}
export function doActivity(data: GameData, life: Life, slug: string): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const m = metroOf(data, l);
  const a = m.activities.find((x) => x.slug === slug) ?? m.trips.find((x) => x.slug === slug);
  if (!a) return fail(l, "Not available here.");
  const cost = activityCost(a);
  if (l.cash < cost) return fail(l, `You need ${money(cost)} for this.`);
  spend(l, cost);
  const firstTime = !l.visited.includes(a.slug);
  if (firstTime) l.visited.push(a.slug);
  const novelty = firstTime ? 1 : 0.5;
  bump(l, { mood: Math.round(a.effects.mood * novelty) + rng.int(-1, 2), vitality: a.effects.vitality });
  done(l, rng);
  const verb = a.kind === "trip" ? `You took a trip to ${a.name}${a.distanceKm ? ` (${a.distanceKm} km away)` : ""}` : `You spent a day at ${a.name}`;
  return act(l, `${verb}${cost ? ` — ${money(cost)}` : ""}.${firstTime ? " First visit!" : ""}`, "good");
}

export function workout(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (l.cash < ASSUME.gymCost) return fail(l, "You can't afford the gym.");
  spend(l, ASSUME.gymCost);
  bump(l, { vitality: rng.int(3, 6), mood: 2, drive: 1 });
  done(l, rng);
  return act(l, "You worked out regularly for a few months.", "good");
}
export function study(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  bump(l, { smarts: rng.int(2, 5), mood: -1 });
  done(l, rng);
  return act(l, "You spent your free time reading and taking online courses.", "good");
}
export function socialize(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  bump(l, { charisma: rng.int(2, 4), mood: rng.int(2, 5) });
  done(l, rng);
  return act(l, "You spent time with friends.", "good");
}
export function seeDoctor(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const cost = insured(l) ? ASSUME.doctorVisitInsured : ASSUME.doctorVisitUninsured;
  if (l.cash < cost) return fail(l, `A visit costs ${money(cost)}${insured(l) ? " (copay)" : " without insurance"}.`);
  spend(l, cost);
  const acute = l.conditions.filter((c) => ACUTE.has(c));
  l.conditions = l.conditions.filter((c) => !ACUTE.has(c));
  bump(l, { vitality: rng.int(2, 5) + acute.length * 4 });
  done(l, rng);
  const chronic = l.conditions.length ? ` You are managing: ${l.conditions.join(", ")}.` : "";
  return act(l, `You saw a doctor (${money(cost)}).${acute.length ? ` Treated: ${acute.join(", ")}.` : " Clean checkup."}${chronic}`, "good");
}
export function nightOut(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (l.age < 21) return fail(l, "Florida's drinking age is 21.");
  if (l.cash < ASSUME.nightOutCost) return fail(l, "You can't afford a night out.");
  spend(l, ASSUME.nightOutCost);
  bump(l, { mood: rng.int(4, 8), charisma: 1, vitality: -2 });
  done(l, rng);
  if (rng.chance(0.04)) {
    spend(l, ASSUME.duiTotalCost);
    l.record.arrests++;
    bump(l, { mood: -15 });
    let extra = "";
    if (l.job && rng.chance(0.3)) {
      extra = ` Your employer let you go as ${l.job.title}.`;
      l.job = null;
    }
    return act(l, `You drove home after drinking and were arrested for DUI. License suspended, fines, court costs and a lawyer: about ${money(ASSUME.duiTotalCost)}. It is now on your record.${extra}`, "bad");
  }
  return act(l, "You went out downtown with friends. Great night.", "good");
}

export function retire(life: Life): Result {
  const { l, rng, err } = begin(life, false);
  if (err) return fail(l, err);
  if (l.age < 62) return fail(l, "Social Security retirement benefits start at 62.");
  const base = Math.min(48000, 0.42 * (l.job?.salary ?? 30000));
  const factor = l.age >= 67 ? 1 : 0.7 + (l.age - 62) * 0.06;
  l.retirementIncome = Math.round((base * factor) / 12) * 12;
  if (l.job) log(l, `You retired from your job as ${l.job.title}.`);
  l.job = null;
  done(l, rng, false);
  return act(l, `You claimed Social Security at ${l.age}: about ${money(l.retirementIncome)} a year (game estimate).`, "good");
}

// ------------------------------------------------------------------ fishing & hunting
const ACUTE = new Set(["Flu", "Sprained ankle", "Broken wrist", "Back injury", "Bad sunburn"]);
export function spotSpecies(data: GameData, spot: GameSpot, mode: "fish" | "hunt") {
  const regionOk = (rs: string[]) => rs.includes("all") || rs.includes(spot.region) || (spot.region === "keys" && rs.includes("south"));
  return data.species.filter((s) => s.mode === mode && s.habitats.some((h) => spot.habitats.includes(h)) && regionOk(s.regions) && !/alligator/i.test(s.common));
}
export function needsFishingLicense(l: Life) {
  return l.age >= 16 && l.age < 65; // Florida residents 65+ are exempt
}
export function buyLicense(data: GameData, life: Life, kind: "fishing" | "hunting"): Result {
  const { l, rng, err } = begin(life, false);
  if (err) return fail(l, err);
  const cost = data.licenses[kind];
  if (l.licenses[kind] === l.year) return fail(l, "You already have this year's license.");
  if (kind === "hunting" && l.birthYear > data.licenses.hunterSafetyBornAfter && !l.hunterSafety) return fail(l, `Florida requires a hunter safety course for anyone born after ${data.licenses.hunterSafetyBornAfter}.`);
  if (l.cash < cost) return fail(l, `A license costs ${money(cost)}.`);
  spend(l, cost);
  l.licenses[kind] = l.year;
  done(l, rng, false);
  return act(l, `You bought a Florida resident ${kind} license for ${l.year} (${money(cost)}).`, "good");
}
export function takeHunterSafety(life: Life): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  if (l.hunterSafety) return fail(l, "You are already certified.");
  spend(l, ASSUME.hunterSafetyCourse);
  l.hunterSafety = true;
  bump(l, { smarts: 1 });
  done(l, rng);
  return act(l, "You passed the Florida hunter safety course (classroom + range day).", "good");
}

export function goOutdoors(data: GameData, life: Life, spotName: string, mode: "fish" | "hunt"): Result {
  const { l, rng, err } = begin(life);
  if (err) return fail(l, err);
  const spot = metroOf(data, l).spots.find((s) => s.name === spotName);
  if (!spot) return fail(l, "Unknown spot.");
  if (mode === "fish") {
    if (!spot.habitats.some((h) => h !== "hunting")) return fail(l, "No fishing here.");
    if (needsFishingLicense(l) && l.licenses.fishing !== l.year) return fail(l, "You need a Florida fishing license for this year.");
  } else {
    if (!spot.habitats.includes("hunting")) return fail(l, "No hunting here.");
    if (l.licenses.hunting !== l.year) return fail(l, "You need a Florida hunting license for this year.");
  }
  const offshore = mode === "fish" && spot.habitats.includes("offshore") && !spot.habitats.includes("freshwater");
  const cost = mode === "hunt" ? ASSUME.huntingTripCost : offshore ? ASSUME.charterShare : ASSUME.fishingTripCost;
  if (l.cash < cost) return fail(l, `This outing costs about ${money(cost)}.`);
  spend(l, cost);
  done(l, rng);
  const experience = Object.values(l.lifeList).reduce((s, n) => s + n, 0);
  const pool = spotSpecies(data, spot, mode);
  const tries = mode === "fish" ? 3 : 1;
  const caught: string[] = [];
  for (let i = 0; i < tries; i++) {
    const s = rng.weighted(pool, (x) => x.rarity);
    if (!s) break;
    const p = mode === "fish" ? 0.3 + Math.min(0.3, experience * 0.015) + s.rarity * 0.3 : 0.15 + Math.min(0.25, experience * 0.03) + s.rarity * 0.5 + (l.stats.vitality - 50) / 300;
    if (rng.chance(p)) caught.push(s.common);
  }
  const newOnes = caught.filter((c) => !l.lifeList[c]);
  for (const c of caught) l.lifeList[c] = (l.lifeList[c] ?? 0) + 1;
  bump(l, { mood: caught.length ? 6 + caught.length : 2, vitality: mode === "hunt" ? 2 : 1 });
  const where = `${spot.name}${spot.distanceKm ? ` (${spot.distanceKm} km)` : ""}`;
  // real risks of the outdoors
  if (mode === "hunt" && rng.chance(0.015)) {
    const bill = insured(l) ? ASSUME.erBillInsured : ASSUME.erBillUninsured;
    spend(l, bill);
    l.conditions.push("Back injury");
    bump(l, { vitality: -15, mood: -8 });
    log(l, `You fell from a tree stand. ER visit: ${money(bill)}.`, "bad");
  } else if (rng.chance(0.03)) {
    l.conditions.push("Bad sunburn");
    bump(l, { vitality: -3 });
  }
  if (!caught.length) return act(l, mode === "fish" ? `You fished ${where} all day. Nothing bit.` : `You hunted ${where} from dawn. You saw sign, but no shot.`);
  const list = [...new Set(caught)].map((c) => `${c}${caught.filter((x) => x === c).length > 1 ? ` ×${caught.filter((x) => x === c).length}` : ""}`).join(", ");
  if (mode === "hunt" && caught.some((c) => /deer|hog/i.test(c))) l.cash += 250; // meat in the freezer offsets groceries
  return act(l, `${mode === "fish" ? "You fished" : "You hunted"} ${where}${offshore ? " on a charter boat" : ""} and ${mode === "fish" ? "caught" : "harvested"}: ${list}.${newOnes.length ? ` New on your life list: ${newOnes.join(", ")}!` : ""}`, "good");
}

// ------------------------------------------------------------------ the year passes
const STORM_NAMES = ["Arthur", "Bertha", "Cristobal", "Dolly", "Edouard", "Fay", "Gonzalo", "Hanna", "Isaias", "Josephine", "Kyle", "Marco", "Nana", "Omar", "Paulette", "Rene", "Sally", "Teddy", "Vicky", "Wilfred"];

function causeOfDeath(rng: Rng, l: Life): string {
  const a = l.age;
  const table: [string, number][] =
    a < 25 ? [["a car crash", 4], ["an accidental drug overdose", 3], ["drowning", 1], ["suicide", 2], ["a shooting", 2], ["cancer", 1]]
    : a < 45 ? [["an accidental drug overdose", 4], ["a car crash", 3], ["heart disease", 2], ["cancer", 2], ["suicide", 2], ["liver disease", 1]]
    : a < 65 ? [["cancer", 5], ["heart disease", 4], ["an accident", 2], ["a stroke", 1], ["liver disease", 1], ["diabetes complications", 1]]
    : [["heart disease", 5], ["cancer", 4], ["a stroke", 2], ["COPD", 1], ["Alzheimer's disease", 2], ["diabetes complications", 1], ["a fall", 1]];
  return rng.weighted(table, (t) => t[1])![0];
}

export function ageUp(data: GameData, life: Life): Result {
  const { l, rng, err } = begin(life, false);
  if (err) return fail(l, err);
  const m = metroOf(data, l);

  // --- money for the year
  const income = (l.job?.salary ?? 0) + l.retirementIncome;
  const pay = takeHomePay(l.job?.salary ?? 0, data.taxes);
  const takeHome = pay.takeHome + l.retirementIncome * 0.95;
  const housing = l.home.kind === "rent" ? l.home.monthlyRent * 12 : 0;
  const basics = Math.round((l.home.kind === "rent" ? ASSUME.livingCostRenting : ASSUME.livingCostWithParents) * m.costIndex - (insured(l) ? ASSUME.employerHealthSaving : 0));
  const discretionary = Math.max(0, takeHome - housing - basics - (l.study?.tuitionPerYear ?? 0));
  const living = basics + Math.round(ASSUME.lifestyleShare[l.lifestyle] * discretionary);
  const tuition = l.study?.tuitionPerYear ?? 0;
  const interest = Math.round(l.debt * ASSUME.debtInterest);
  l.cash += takeHome - housing - living - tuition;
  l.debt += interest;
  if (l.cash < 0) {
    l.debt += -l.cash;
    log(l, `You came up ${money(-l.cash)} short this year and covered it with ${tuition ? "student loans" : "credit cards"}.`, "bad");
    l.cash = 0;
  } else if (l.debt > 0) {
    const paydown = Math.min(l.debt, Math.max(0, l.cash - 1000) * 0.5);
    l.debt -= paydown;
    l.cash -= paydown;
  }
  l.cash = Math.round(l.cash);
  l.debt = Math.round(l.debt);
  l.lastYear = { income, takeHome: Math.round(takeHome), housing, living, tuition, interest, other: Math.round(l.spentThisYear) };

  // --- job
  if (l.job) {
    const j = l.job;
    const gj = m.jobs.find((x) => x.soc === j.soc);
    j.years++;
    l.workYears++;
    j.performance = clamp(j.performance + (l.stats.drive - 50) / 10 + (55 - j.performance) * 0.25 + rng.int(-8, 8) - (l.study ? 6 : 0));
    if (j.performance < 20 && rng.chance(0.5)) {
      log(l, `You were fired from your job as ${j.title} for poor performance.`, "bad");
      bump(l, { mood: -12 });
      l.job = null;
    } else if (rng.chance(0.03)) {
      const ra = ASSUME.reemploymentWeekly * ASSUME.reemploymentWeeks;
      log(l, `Your employer had layoffs and your position as ${j.title} was cut. Florida Reemployment Assistance paid you ${money(ra)} (max $${ASSUME.reemploymentWeekly}/week, ${ASSUME.reemploymentWeeks} weeks).`, "bad");
      l.cash += ra;
      bump(l, { mood: -10 });
      l.job = null;
    } else {
      const raise = 0.015 + (j.performance > 65 ? 0.015 : 0) + (j.performance > 80 ? 0.02 : 0);
      const cap = gj?.wage.p90 ?? j.salary * 1.5;
      j.salary = Math.round(Math.min(cap, j.salary * (1 + raise)) / 100) * 100;
      if (j.performance > 65 && rng.chance(0.25)) {
        const bonus = Math.round((j.salary * rng.range(0.03, 0.08)) / 50) * 50;
        l.cash += Math.round(bonus * 0.75);
        log(l, `Year-end bonus at work: ${money(bonus)} before taxes.`, "good");
      }
    }
  }

  // --- school
  if (l.study) {
    l.study.yearsLeft--;
    bump(l, { smarts: rng.int(2, 4) });
    if (l.study.yearsLeft <= 0) {
      l.education = l.study.target;
      log(l, `You graduated: ${EDUCATION_LABELS[l.study.target]} (${l.study.label}).`, "good");
      bump(l, { mood: 10 });
      l.study = null;
    }
  }

  // --- the calendar turns
  l.year++;
  l.age++;
  l.actionsLeft = ACTIONS_PER_YEAR;
  l.spentThisYear = 0;

  // --- body and mind
  const aging = l.age > 75 ? -2.5 : l.age > 60 ? -1.5 : l.age > 45 ? -0.8 : l.age > 30 ? -0.3 : 0;
  bump(l, { vitality: aging + rng.int(-2, 2) - 0.5 * l.conditions.filter((c) => !ACUTE.has(c)).length });
  l.conditions = l.conditions.filter((c) => !ACUTE.has(c) || rng.chance(0.3)); // most acute problems heal on their own
  const moodTarget = 55 + (l.job ? 4 : l.age < 65 && !l.study ? -6 : 0) - (l.debt > 25000 ? 6 : l.debt > 5000 ? 3 : 0) - (l.home.kind === "parents" && l.age > 25 ? 5 : 0);
  bump(l, { mood: Math.round((moodTarget - l.stats.mood) * 0.25) + rng.int(-3, 3) + ASSUME.lifestyleMood[l.lifestyle] });
  if (l.age > 60) bump(l, { smarts: rng.int(-2, 0) });

  // chronic conditions (real risk factors, game odds)
  const addCondition = (c: string, p: number) => {
    if (!l.conditions.includes(c) && rng.chance(p)) {
      l.conditions.push(c);
      log(l, `Your doctor diagnosed you with ${c.toLowerCase()}.`, "bad");
    }
  };
  if (l.age >= 35) addCondition("High blood pressure", 0.02 + (100 - l.stats.vitality) / 2500);
  if (l.age >= 40) addCondition("Type 2 diabetes", l.stats.vitality < 45 ? 0.025 : 0.008);
  if (l.age >= 50) addCondition("Heart disease", 0.004 + (100 - l.stats.vitality) / 6000);

  // --- events
  yearEvents(l, m, rng);

  // --- hurricanes (real annual odds for this metro)
  if (rng.chance(m.hurricaneAnnualProbability)) hurricane(l, m, rng);

  // --- mortality: SSA q(age) adjusted by health (adjustment is a game assumption)
  const q = (l.gender === "male" ? data.lifeTable.male : data.lifeTable.female)[Math.min(l.age, 119)] ?? 1;
  const health = (0.6 + (100 - l.stats.vitality) / 100) * Math.pow(1.12, l.conditions.filter((c) => !ACUTE.has(c)).length);
  if (rng.chance(Math.min(1, q * health))) {
    l.alive = false;
    l.causeOfDeath = causeOfDeath(rng, l);
    log(l, `${l.name} died at age ${l.age} of ${l.causeOfDeath}.`, "bad");
  } else {
    log(l, `— ${l.year}: you are ${l.age}. —`);
  }
  done(l, rng, false);
  return { life: l, ok: true, message: l.alive ? `Age ${l.age}` : `Died at ${l.age}` };
}

function yearEvents(l: Life, m: GameMetro, rng: Rng) {
  const events: { p: number; run: () => void; when?: boolean }[] = [
    { p: 0.12, run: () => { l.conditions.push("Flu"); bump(l, { vitality: -4, mood: -2 }); log(l, "You came down with the flu and missed a week.", "bad"); } },
    { p: 0.12, run: () => { const c = rng.int(400, 1800); l.cash -= c; log(l, `Your car broke down in the Florida heat. Repair bill: ${money(c)}.`, "bad"); } },
    { p: 0.06, run: () => { const c = rng.int(160, 280); l.cash -= c; l.record.tickets++; log(l, `Speeding ticket on the interstate: ${money(c)}.`, "bad"); } },
    { p: 0.035, run: () => { const bill = insured(l) ? ASSUME.erBillInsured : ASSUME.erBillUninsured; l.cash -= 1000 + bill; bump(l, { vitality: -rng.int(8, 20), mood: -6 }); l.conditions.push(rng.pick(["Broken wrist", "Back injury"])); log(l, `You were in a car crash. Insurance deductible plus medical bills: ${money(1000 + bill)}.`, "bad"); } },
    { p: 0.04, run: () => { l.cash -= 450; bump(l, { mood: 5, charisma: 1 }); log(l, "You went to a friend's wedding (gift, outfit and travel: $450).", "good"); } },
    { p: 0.03, run: () => { bump(l, { smarts: 1 }); log(l, "You were summoned for jury duty at the county courthouse."); } },
    { p: 0.03, run: () => { l.cash -= 600; log(l, "Your identity was stolen; cleaning it up cost you $600.", "bad"); } },
    { p: 0.04, run: () => { log(l, "An alligator wandered into your neighborhood retention pond. FWC sent a trapper."); } },
    { p: 0.05, run: () => { const w = rng.int(20, 500); l.cash += w; bump(l, { mood: 3 }); log(l, `You won ${money(w)} on a Florida Lottery scratch-off.`, "good"); } },
    { p: 0.08, when: m.slug === "tampa" || m.slug === "destin", run: () => { bump(l, { mood: -2 }); log(l, "Red tide closed the beaches for weeks; the air made everyone cough."); } },
    { p: 0.1, when: m.slug === "miami", run: () => { const c = rng.int(0, 1) ? 0 : rng.int(300, 1500); l.cash -= c; log(l, `King tide flooding hit your street${c ? `; salt water damaged your car (${money(c)})` : ""}.`, c ? "bad" : "neutral"); } },
    { p: 0.05, when: !!l.job, run: () => { bump(l, { mood: -4 }); if (l.job) l.job.performance = clamp(l.job.performance - 8); log(l, "Your new manager is a nightmare. Work got stressful.", "bad"); } },
    { p: 0.04, when: l.age < 40, run: () => { bump(l, { mood: 4 }); log(l, "You adopted a dog from the county shelter.", "good"); } },
  ];
  let n = 0;
  for (const e of events) {
    if (n >= 2) break;
    if (e.when === false) continue;
    if (rng.chance(e.p)) {
      e.run();
      n++;
    }
  }
}

function hurricane(l: Life, m: GameMetro, rng: Rng) {
  const name = rng.pick(STORM_NAMES);
  const r = rng.next();
  if (r < 0.7) {
    const c = rng.int(300, 900);
    l.cash -= c;
    bump(l, { mood: -4 });
    log(l, `Hurricane ${name} brushed ${m.name}. Days without power, spoiled food, generator gas: ${money(c)}.`, "bad");
  } else if (r < 0.95) {
    const c = rng.int(1500, 4000);
    l.cash -= c;
    bump(l, { mood: -8, vitality: -2 });
    log(l, `Hurricane ${name} made landfall near ${m.name}. You evacuated; storm damage and hotels cost ${money(c)}.`, "bad");
  } else {
    const c = rng.int(6000, 15000);
    l.cash -= c;
    bump(l, { mood: -15, vitality: -5 });
    if (l.job && rng.chance(0.25)) {
      log(l, `Your workplace was destroyed and you lost your job as ${l.job.title}.`, "bad");
      l.job = null;
    }
    log(l, `Major Hurricane ${name} hit ${m.name} directly. Your home was badly damaged; you lost ${money(c)} in belongings and repairs.`, "bad");
  }
}

export function netWorth(l: Life) {
  return l.cash - l.debt;
}

export function setLifestyle(life: Life, lifestyle: Lifestyle): Result {
  const l = clone(life);
  l.lifestyle = lifestyle;
  const text = { frugal: "You cut back: cooking at home, no subscriptions, a cheap used car.", normal: "You live a normal lifestyle.", lavish: "You upgraded: dining out, a new car lease, nice vacations." }[lifestyle];
  return act(l, text);
}
