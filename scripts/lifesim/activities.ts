/**
 * Life sim activities: real places from the encyclopedia enrichment bundles.
 *  - Local activities per metro: best-known outdoor places and attractions in the metro's counties.
 *  - Statewide trips: National Park Service units and other national protected areas in the state,
 *    with the real distance from each metro anchor.
 * Gameplay effects (mood, vitality) and cost bands are GAME ASSUMPTIONS, labeled as such.
 * Output: seed/lifesim/activities.json
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { SEED_DIR, writeJson } from "../ingest/lib";
import { haversineKm } from "../../src/lib/data/fixture-provider";
import { loadSeedInputs } from "../../src/lib/data/inputs";
import { METROS } from "./metros";

type Rec = { qid: string; slug: string; status?: string; curatedSlug?: string; name: string; categories: { slug: string; primary: boolean }[]; coords?: { lat: number; lon: number }; prominence?: number; media: { url: string; kind: string }[]; wikipedia?: { extract: string }; origin: string };

/** Activity kinds with gameplay assumptions (not facts). */
const KINDS: Record<string, { kind: string; mood: number; vitality: number; cost: "free" | "low" | "medium" | "high" }> = {
  "state-parks": { kind: "outdoor", mood: 6, vitality: 4, cost: "low" },
  "protected-areas": { kind: "outdoor", mood: 6, vitality: 4, cost: "low" },
  "municipal-parks": { kind: "outdoor", mood: 4, vitality: 3, cost: "free" },
  "coastlines-beaches": { kind: "outdoor", mood: 7, vitality: 3, cost: "free" },
  trails: { kind: "outdoor", mood: 5, vitality: 5, cost: "free" },
  islands: { kind: "outdoor", mood: 6, vitality: 3, cost: "low" },
  "botanical-gardens": { kind: "outdoor", mood: 5, vitality: 2, cost: "low" },
  "wetlands-ecosystems": { kind: "outdoor", mood: 5, vitality: 3, cost: "low" },
  "zoos-aquariums": { kind: "attraction", mood: 6, vitality: 1, cost: "medium" },
  "theme-parks": { kind: "attraction", mood: 9, vitality: 0, cost: "high" },
  museums: { kind: "culture", mood: 4, vitality: 0, cost: "low" },
  "historic-sites": { kind: "culture", mood: 3, vitality: 1, cost: "low" },
  landmarks: { kind: "culture", mood: 4, vitality: 0, cost: "free" },
  "performing-arts": { kind: "culture", mood: 6, vitality: 0, cost: "medium" },
  "stadiums-arenas": { kind: "sports", mood: 7, vitality: 0, cost: "medium" },
};
const NATIONAL = /\bNational (Park|Seashore|Preserve|Monument|Memorial|Wildlife Refuge|Forest|Marine Sanctuary|Historic Site|Recreation Area)\b/;
const PER_METRO = 30;

function main() {
  const dir = path.join(SEED_DIR, "generated");
  const bundles = readdirSync(dir).filter((f) => /^enrich-.*\.json$/.test(f)).map((f) => ({ file: f, data: JSON.parse(readFileSync(path.join(dir, f), "utf8")) as { areaSlug: string; entities: Rec[] } }));
  const census = loadSeedInputs().census.areas;
  const anchor = Object.fromEntries(METROS.map((m) => [m.slug, census.find((a) => a.slug === m.anchorPlace)!.internalPoint!]));

  const toActivity = (r: Rec) => {
    const primary = r.categories.find((c) => c.primary)?.slug ?? r.categories[0]!.slug;
    const k = KINDS[primary] ?? KINDS[r.categories.map((c) => c.slug).find((s) => KINDS[s]) ?? ""];
    return k
      ? {
          slug: r.curatedSlug ?? r.slug, name: r.name, category: primary, kind: k.kind, prominence: r.prominence ?? 0,
          lat: r.coords?.lat ?? null, lon: r.coords?.lon ?? null,
          image: r.media.find((m) => m.kind === "photo")?.url ?? null,
          blurb: r.wikipedia?.extract.split(/(?<=\.)\s/)[0]?.slice(0, 220) ?? null,
          effects: { mood: k.mood, vitality: k.vitality }, costBand: k.cost,
        }
      : null;
  };

  const local: Record<string, ReturnType<typeof toActivity>[]> = {};
  for (const m of METROS) {
    const counties = new Set<string>(m.counties);
    const seen = new Set<string>();
    const items = bundles
      .filter((b) => counties.has(b.data.areaSlug))
      .flatMap((b) => b.data.entities)
      .filter((r) => r.origin === "wikidata-place" && r.status !== "historical" && !NATIONAL.test(r.name))
      .map(toActivity)
      .filter((a): a is NonNullable<typeof a> => !!a && !seen.has(a.slug) && (seen.add(a.slug), true))
      .sort((a, b) => b.prominence - a.prominence)
      .slice(0, PER_METRO);
    local[m.slug] = items;
    console.log(`${m.name.padEnd(13)} ${items.length} activities; top: ${items.slice(0, 4).map((a) => a.name).join(" | ")}`);
  }

  const seenNat = new Set<string>();
  const national = bundles
    .flatMap((b) => b.data.entities)
    .filter((r) => r.origin === "wikidata-place" && NATIONAL.test(r.name) && r.coords)
    .filter((r) => !seenNat.has(r.qid) && (seenNat.add(r.qid), true))
    .map((r) => {
      const a = toActivity({ ...r, categories: [{ slug: "protected-areas", primary: true }] })!;
      const distanceKm = Object.fromEntries(METROS.map((m) => [m.slug, Math.round(haversineKm(anchor[m.slug]!.lat, anchor[m.slug]!.lon, r.coords!.lat, r.coords!.lon))]));
      return { ...a, kind: "trip", designation: r.name.match(NATIONAL)![0], effects: { mood: 10, vitality: 5 }, costBand: "medium" as const, distanceKm };
    })
    .sort((a, b) => b.prominence - a.prominence);
  console.log(`statewide national areas: ${national.length}; top: ${national.slice(0, 6).map((a) => a.name).join(" | ")}`);

  writeJson(path.join(SEED_DIR, "lifesim", "activities.json"), {
    source: { note: "Places from the America 360 encyclopedia (Wikidata, CC0; Wikipedia summaries CC BY-SA; photos per-file licenses). Effects and cost bands are game assumptions, not facts." },
    local,
    statewide: national,
  });
  console.log("wrote seed/lifesim/activities.json");
}

main();
