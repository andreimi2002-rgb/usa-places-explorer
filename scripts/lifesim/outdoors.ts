/**
 * Life sim: fishing and hunting with real species and real places (Florida).
 *  - Species: curated by scientific name, verified and enriched from Wikidata (taxon name P225,
 *    English label, Wikipedia article).
 *  - Spots: curated real waters/forests per metro, located through Wikidata (coordinates P625),
 *    with the real distance to the metro anchor.
 * Habitat assignments and catch odds are GAME ASSUMPTIONS based on common Florida knowledge.
 * Output: seed/lifesim/outdoors.json
 */
import path from "node:path";
import { SEED_DIR, USER_AGENT, writeJson } from "../ingest/lib";
import { haversineKm } from "../../src/lib/data/fixture-provider";
import { loadSeedInputs } from "../../src/lib/data/inputs";
import { METROS } from "./metros";

type Habitat = "freshwater" | "inshore" | "offshore" | "hunting";
type Region = "all" | "south" | "gulf" | "atlantic" | "keys" | "north" | "panhandle";

const SPECIES: { sci: string; common: string; mode: "fish" | "hunt"; habitats: Habitat[]; regions: Region[]; rarity: number; note?: string }[] = [
  { sci: "Micropterus salmoides", common: "Largemouth bass", mode: "fish", habitats: ["freshwater"], regions: ["all"], rarity: 0.45 },
  { sci: "Lepomis macrochirus", common: "Bluegill", mode: "fish", habitats: ["freshwater"], regions: ["all"], rarity: 0.7 },
  { sci: "Pomoxis nigromaculatus", common: "Black crappie", mode: "fish", habitats: ["freshwater"], regions: ["north", "all"], rarity: 0.4 },
  { sci: "Ictalurus punctatus", common: "Channel catfish", mode: "fish", habitats: ["freshwater"], regions: ["all"], rarity: 0.45 },
  { sci: "Cichla ocellaris", common: "Butterfly peacock bass", mode: "fish", habitats: ["freshwater"], regions: ["south"], rarity: 0.35, note: "Introduced to South Florida canals" },
  { sci: "Centropomus undecimalis", common: "Common snook", mode: "fish", habitats: ["inshore"], regions: ["south", "gulf", "atlantic"], rarity: 0.25 },
  { sci: "Sciaenops ocellatus", common: "Red drum (redfish)", mode: "fish", habitats: ["inshore"], regions: ["all"], rarity: 0.35 },
  { sci: "Cynoscion nebulosus", common: "Spotted seatrout", mode: "fish", habitats: ["inshore"], regions: ["all"], rarity: 0.45 },
  { sci: "Megalops atlanticus", common: "Atlantic tarpon", mode: "fish", habitats: ["inshore"], regions: ["south", "keys", "gulf"], rarity: 0.1 },
  { sci: "Archosargus probatocephalus", common: "Sheepshead", mode: "fish", habitats: ["inshore"], regions: ["all"], rarity: 0.4 },
  { sci: "Albula vulpes", common: "Bonefish", mode: "fish", habitats: ["inshore"], regions: ["keys"], rarity: 0.12 },
  { sci: "Lutjanus campechanus", common: "Red snapper", mode: "fish", habitats: ["offshore"], regions: ["gulf", "panhandle"], rarity: 0.4 },
  { sci: "Mycteroperca microlepis", common: "Gag grouper", mode: "fish", habitats: ["offshore"], regions: ["gulf", "atlantic", "panhandle"], rarity: 0.25 },
  { sci: "Coryphaena hippurus", common: "Mahi-mahi", mode: "fish", habitats: ["offshore"], regions: ["atlantic", "keys", "gulf", "panhandle"], rarity: 0.3 },
  { sci: "Istiophorus platypterus", common: "Sailfish", mode: "fish", habitats: ["offshore"], regions: ["atlantic", "keys"], rarity: 0.08 },
  { sci: "Scomberomorus cavalla", common: "King mackerel", mode: "fish", habitats: ["offshore"], regions: ["all"], rarity: 0.3 },
  { sci: "Rachycentron canadum", common: "Cobia", mode: "fish", habitats: ["offshore", "inshore"], regions: ["gulf", "atlantic", "panhandle"], rarity: 0.12 },
  { sci: "Odocoileus virginianus", common: "White-tailed deer", mode: "hunt", habitats: ["hunting"], regions: ["all"], rarity: 0.3 },
  { sci: "Meleagris gallopavo osceola", common: "Osceola wild turkey", mode: "hunt", habitats: ["hunting"], regions: ["all"], rarity: 0.15, note: "Subspecies found only on the Florida peninsula" },
  { sci: "Sus scrofa", common: "Feral hog", mode: "hunt", habitats: ["hunting"], regions: ["all"], rarity: 0.3 },
  { sci: "Aix sponsa", common: "Wood duck", mode: "hunt", habitats: ["hunting"], regions: ["north", "all"], rarity: 0.25 },
  { sci: "Anas fulvigula", common: "Mottled duck", mode: "hunt", habitats: ["hunting"], regions: ["south", "all"], rarity: 0.2 },
  { sci: "Colinus virginianus", common: "Northern bobwhite", mode: "hunt", habitats: ["hunting"], regions: ["north", "panhandle"], rarity: 0.25 },
  { sci: "Alligator mississippiensis", common: "American alligator", mode: "hunt", habitats: ["hunting"], regions: ["all"], rarity: 0.1, note: "Hunted only with a limited-entry alligator harvest permit" },
];

const SPOTS: { metro: string; name: string; search: string; habitats: Habitat[]; region: Region }[] = [
  { metro: "jacksonville", name: "St. Johns River", search: "St. Johns River", habitats: ["freshwater", "inshore"], region: "atlantic" },
  { metro: "jacksonville", name: "Nassau Sound / Amelia Island", search: "Amelia Island", habitats: ["inshore", "offshore"], region: "atlantic" },
  { metro: "jacksonville", name: "Jennings State Forest", search: "Jennings State Forest", habitats: ["hunting"], region: "north" },
  { metro: "orlando", name: "Lake Tohopekaliga", search: "Lake Tohopekaliga", habitats: ["freshwater"], region: "all" },
  { metro: "orlando", name: "Lake Kissimmee", search: "Lake Kissimmee", habitats: ["freshwater"], region: "all" },
  { metro: "orlando", name: "Mosquito Lagoon", search: "Mosquito Lagoon", habitats: ["inshore"], region: "atlantic" },
  { metro: "orlando", name: "Ocala National Forest", search: "Ocala National Forest", habitats: ["hunting", "freshwater"], region: "north" },
  { metro: "miami", name: "Biscayne Bay", search: "Biscayne Bay", habitats: ["inshore", "offshore"], region: "atlantic" },
  { metro: "miami", name: "Islamorada (Florida Keys)", search: "Islamorada, Florida", habitats: ["inshore", "offshore"], region: "keys" },
  { metro: "miami", name: "Everglades canals", search: "Everglades", habitats: ["freshwater", "hunting"], region: "south" },
  { metro: "tampa", name: "Tampa Bay", search: "Tampa Bay", habitats: ["inshore", "offshore"], region: "gulf" },
  { metro: "tampa", name: "Lake Tarpon", search: "Lake Tarpon", habitats: ["freshwater"], region: "all" },
  { metro: "tampa", name: "Withlacoochee State Forest", search: "Withlacoochee State Forest", habitats: ["hunting"], region: "all" },
  { metro: "destin", name: "Choctawhatchee Bay", search: "Choctawhatchee Bay", habitats: ["inshore"], region: "panhandle" },
  { metro: "destin", name: "Destin offshore (Gulf)", search: "Destin, Florida", habitats: ["offshore"], region: "panhandle" },
  { metro: "destin", name: "Eglin Air Force Base range (hunting by permit)", search: "Eglin Air Force Base", habitats: ["hunting"], region: "north" },
  { metro: "tallahassee", name: "Lake Talquin", search: "Lake Talquin", habitats: ["freshwater"], region: "north" },
  { metro: "tallahassee", name: "Apalachicola National Forest", search: "Apalachicola National Forest", habitats: ["hunting", "freshwater"], region: "north" },
  { metro: "tallahassee", name: "St. Marks (Apalachee Bay)", search: "St. Marks National Wildlife Refuge", habitats: ["inshore", "hunting"], region: "panhandle" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get<T>(url: string): Promise<T> {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (res.ok) return (await res.json()) as T;
    await sleep(3000 * (i + 1));
  }
  throw new Error(`failed ${url}`);
}

async function main() {
  // species via SPARQL on scientific names
  const values = SPECIES.map((s) => `"${s.sci}"`).join(" ");
  const q = `SELECT ?sci ?item ?label ?article WHERE { VALUES ?sci { ${values} } ?item wdt:P225 ?sci . OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label)="en") } OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> } }`;
  const r = await get<{ results: { bindings: Record<string, { value: string }>[] } }>(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`);
  const bySci = new Map<string, { qid: string; label?: string; article?: string }>();
  for (const b of r.results.bindings) if (!bySci.has(b.sci!.value)) bySci.set(b.sci!.value, { qid: b.item!.value.split("/").pop()!, label: b.label?.value, article: b.article?.value });
  const species = SPECIES.map((s) => ({ ...s, wikidata: bySci.get(s.sci)?.qid ?? null, wikipedia: bySci.get(s.sci)?.article ?? null }));
  const missing = species.filter((s) => !s.wikidata).map((s) => s.sci);
  console.log(`species: ${species.length - missing.length}/${species.length} verified in Wikidata${missing.length ? `; missing: ${missing.join(", ")}` : ""}`);

  // spots via wbsearchentities + coordinates
  const census = loadSeedInputs().census.areas;
  const spots = [];
  for (const s of SPOTS) {
    const search = await get<{ search: { id: string; label: string; description?: string }[] }>(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=5&search=${encodeURIComponent(s.search)}`);
    await sleep(1200);
    let found: { qid: string; lat: number; lon: number } | null = null;
    for (const cand of search.search) {
      const e = await get<{ entities: Record<string, { claims?: { P625?: { mainsnak: { datavalue?: { value: { latitude: number; longitude: number } } } }[] } }> }>(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${cand.id}`);
      await sleep(1200);
      const c = e.entities[cand.id]?.claims?.P625?.[0]?.mainsnak.datavalue?.value;
      if (c && c.latitude > 24 && c.latitude < 31.2 && c.longitude > -88 && c.longitude < -79.8) {
        found = { qid: cand.id, lat: c.latitude, lon: c.longitude };
        break;
      }
    }
    const metro = METROS.find((m) => m.slug === s.metro)!;
    const a = census.find((x) => x.slug === metro.anchorPlace)!.internalPoint!;
    spots.push({ ...s, wikidata: found?.qid ?? null, lat: found?.lat ?? null, lon: found?.lon ?? null, distanceKm: found ? Math.round(haversineKm(a.lat, a.lon, found.lat, found.lon)) : null });
    console.log(`${s.metro.padEnd(13)} ${s.name.padEnd(48)} ${found ? `${found.qid} ${Math.round(haversineKm(a.lat, a.lon, found.lat, found.lon))} km` : "NOT LOCATED"}`);
  }

  writeJson(path.join(SEED_DIR, "lifesim", "outdoors.json"), {
    source: { note: "Species verified by scientific name on Wikidata (CC0); spots located via Wikidata coordinates. Habitats, regions and catch odds are game assumptions. License prices are game estimates until checked against FWC (FWC blocks automated access)." },
    licenses: {
      fishingFreshwater: { annualCost: 17, note: "game estimate, verify with FWC" },
      fishingSaltwater: { annualCost: 17, note: "game estimate, verify with FWC" },
      hunting: { annualCost: 17, note: "game estimate, verify with FWC" },
      hunterSafety: { requiredIfBornAfter: 1975, note: "Florida requires hunter safety certification for hunters born on or after June 1, 1975 (verify with FWC)" },
    },
    species,
    spots,
  });
  console.log("wrote seed/lifesim/outdoors.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
