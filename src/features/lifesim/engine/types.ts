import type { TaxTable } from "./tax";

/** Static game data (built on the server from seed/lifesim, sent to the client once). */
export type EducationLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  0: "No formal credential",
  1: "High school diploma",
  2: "Some college",
  3: "Postsecondary certificate",
  4: "Associate's degree",
  5: "Bachelor's degree",
  6: "Master's degree",
  7: "Doctoral or professional degree",
};

export type GameJob = {
  soc: string;
  title: string;
  employment: number;
  /** Real annual wage percentiles in this metro (BLS OEWS May 2024). */
  wage: { p10: number; p25: number; p50: number; p75: number; p90: number };
  /** Typical entry-level education (BLS Employment Projections). */
  education: EducationLevel;
  experienceYears: number;
};

export type GameActivity = {
  slug: string;
  name: string;
  kind: "outdoor" | "attraction" | "culture" | "sports" | "trip";
  category: string;
  image: string | null;
  blurb: string | null;
  effects: { mood: number; vitality: number };
  costBand: "free" | "low" | "medium" | "high";
  distanceKm?: number;
};

export type Habitat = "freshwater" | "inshore" | "offshore" | "hunting";
export type Region = "all" | "south" | "gulf" | "atlantic" | "keys" | "north" | "panhandle";
/** Real species (verified on Wikidata by scientific name); habitats, regions and rarity are game assumptions. */
export type GameSpecies = { sci: string; common: string; mode: "fish" | "hunt"; habitats: Habitat[]; regions: Region[]; rarity: number; note?: string; wikipedia: string | null };
/** Real fishing/hunting spot near a metro, with the real distance from the city. */
export type GameSpot = { name: string; habitats: Habitat[]; region: Region; distanceKm: number | null };

export type GameMetro = {
  slug: string;
  name: string;
  tagline: string;
  jobs: GameJob[];
  /** HUD FY2026 Fair Market Rents, monthly. */
  rent: { studio: number; br1: number; br2: number; br3: number; br4: number };
  hurricaneAnnualProbability: number;
  activities: GameActivity[];
  trips: GameActivity[];
  spots: GameSpot[];
  /** Game estimate: multiplier on baseline living costs (food, transport, insurance). */
  costIndex: number;
};

export type GameData = {
  version: string;
  metros: GameMetro[];
  /** SSA period life table: q(age) for male/female. */
  lifeTable: { male: number[]; female: number[] };
  taxes: TaxTable;
  species: GameSpecies[];
  licenses: { fishing: number; hunting: number; hunterSafetyBornAfter: number };
  sources: { label: string; url: string }[];
};

// ---------------------------------------------------------------- player state
export type Lifestyle = "frugal" | "normal" | "lavish";
export type Stats = { vitality: number; mood: number; smarts: number; drive: number; charisma: number };
export type Home = { kind: "parents" } | { kind: "rent"; bedrooms: 0 | 1 | 2 | 3 | 4; monthlyRent: number };
export type Job = { soc: string; title: string; salary: number; years: number; performance: number };
export type Study = { target: EducationLevel; label: string; yearsLeft: number; tuitionPerYear: number };

export type LogEntry = { year: number; age: number; text: string; tone?: "good" | "bad" | "neutral" };

export type Life = {
  seed: number;
  rngState: number;
  name: string;
  gender: "male" | "female";
  birthYear: number;
  year: number;
  age: number;
  metro: string;
  alive: boolean;
  causeOfDeath?: string;
  stats: Stats;
  education: EducationLevel;
  study: Study | null;
  job: Job | null;
  workYears: number;
  cash: number;
  debt: number;
  home: Home;
  actionsLeft: number;
  lastYear: { income: number; takeHome: number; housing: number; living: number; tuition: number; interest: number; other: number } | null;
  /** Money spent this year on actions (activities, trips, licenses, moving...). */
  spentThisYear: number;
  log: LogEntry[];
  visited: string[];
  /** Last year through which each annual license is valid. */
  licenses: { fishing: number | null; hunting: number | null };
  hunterSafety: boolean;
  /** Species ever caught or harvested ("life list"), with count. */
  lifeList: Record<string, number>;
  conditions: string[];
  record: { arrests: number; tickets: number };
  /** Annual Social Security benefit once retired (game estimate), else 0. */
  retirementIncome: number;
  brightFutures: boolean;
  lifestyle: Lifestyle;
};
