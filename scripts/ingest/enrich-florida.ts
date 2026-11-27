/**
 * Runs the enrichment adapter for Jacksonville and then every Florida county, one at a time.
 * Resumable: counties whose bundle already exists are skipped (use --force to redo them), and
 * every HTTP response is cached on disk, so an interrupted run loses nothing.
 *
 * Usage: npm run ingest:enrich-florida [-- --force] [-- --only=duval-county-fl,leon-county-fl]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SEED_DIR, hasFlag } from "./lib";

const force = hasFlag("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const census = JSON.parse(readFileSync(path.join(SEED_DIR, "generated", "census-florida.json"), "utf8")) as { areas: { slug: string; areaType: string }[] };
const counties = census.areas.filter((a) => a.areaType === "county").map((a) => a.slug).sort();
// Jacksonville first so existing slugs stay stable; Duval and the others reuse them by Q-id.
const areas = (only ?? ["jacksonville-fl", ...counties]).filter((s, i, arr) => arr.indexOf(s) === i);

const started = Date.now();
const failed: string[] = [];
let done = 0;
for (const slug of areas) {
  const out = path.join(SEED_DIR, "generated", `enrich-${slug}.json`);
  if (existsSync(out) && !force && slug !== "jacksonville-fl") {
    console.log(`[skip] ${slug} (bundle exists)`);
    continue;
  }
  console.log(`\n[${++done}] ${slug} — ${new Date().toISOString().slice(11, 19)}`);
  const r = spawnSync("npx", ["tsx", "scripts/ingest/enrich-area.ts", `--area=${slug}`], { stdio: "inherit", shell: true });
  if (r.status !== 0) {
    failed.push(slug);
    console.log(`[fail] ${slug} (exit ${r.status}); continuing — rerun later to retry`);
  }
}
console.log(`\nfinished in ${Math.round((Date.now() - started) / 60000)} min; failed: ${failed.length ? failed.join(", ") : "none"}`);
process.exit(failed.length ? 1 : 0);
