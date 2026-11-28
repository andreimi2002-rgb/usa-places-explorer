/**
 * Downloads agency files that require a contact email in the User-Agent (BLS, SSA, HUD).
 * The email comes from A360_CONTACT_EMAIL in .env.local (set by the owner, git-ignored).
 * Files are cached with checksums in data/raw/agencies.
 *
 * Usage: npm run ingest:agencies [-- --refresh]
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RAW_DIR, contactUserAgent, hasFlag } from "./lib";

export const AGENCY_FILES = {
  // BLS Occupational Employment and Wage Statistics, May 2024, metropolitan areas
  oews: "https://www.bls.gov/oes/special-requests/oesm24ma.zip",
  // SSA period life table (single year of age, by sex)
  lifeTable: "https://www.ssa.gov/oact/STATS/table4c6.html",
  // HUD Fair Market Rents FY2026
  fmr: "https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY26_FMRs.xlsx",
} as const;

async function main() {
  const ua = contactUserAgent();
  const dir = path.join(RAW_DIR, "agencies");
  mkdirSync(dir, { recursive: true });
  for (const [key, url] of Object.entries(AGENCY_FILES)) {
    const file = path.join(dir, path.basename(new URL(url).pathname));
    if (existsSync(file) && !hasFlag("--refresh")) {
      console.log(`cache  ${key.padEnd(10)} ${path.basename(file)}`);
      continue;
    }
    const res = await fetch(url, { headers: { "user-agent": ua, accept: "*/*" } });
    const bytes = Buffer.from(await res.arrayBuffer());
    const looksHtmlError = bytes.subarray(0, 200).toString("utf8").toLowerCase().includes("access denied");
    console.log(`${res.status}    ${key.padEnd(10)} ${bytes.length} bytes ${looksHtmlError ? "(blocked page)" : ""}`);
    if (res.ok && !looksHtmlError) {
      writeFileSync(file, bytes);
      writeFileSync(`${file}.sha256`, createHash("sha256").update(bytes).digest("hex"));
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  void readFileSync;
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
