/** Typical entry-level education by occupation (BLS Employment Projections). Uses the contact User-Agent from .env.local. */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { RAW_DIR, contactUserAgent } from "../ingest/lib";

const URLS = ["https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm"];
async function main() {
  const ua = contactUserAgent();
  mkdirSync(path.join(RAW_DIR, "agencies"), { recursive: true });
  for (const url of URLS) {
    const res = await fetch(url, { headers: { "user-agent": ua, accept: "text/html" } });
    const body = await res.text();
    console.log(res.status, body.length, url);
    if (res.ok) writeFileSync(path.join(RAW_DIR, "agencies", "bls-ep-characteristics.html"), body);
  }
}
if (!process.argv.includes("--parse")) main();

// ---- parse into seed/lifesim/education.json
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { SEED_DIR, writeJson } from "../ingest/lib";

export function parseEducation() {
  const html = readFileSync(path.join(RAW_DIR, "agencies", "bls-ep-characteristics.html"), "utf8");
  const clean = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
  const out: Record<string, { title: string; education: string; experience: string; training: string }> = {};
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    const cells = (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/g) ?? []).map(clean);
    const soc = cells.find((c) => /^\d{2}-\d{4}$/.test(c));
    if (!soc || cells.length < 13 || !/Line item/i.test(cells.join(" "))) continue;
    const e = cells.findIndex((c) => /degree|diploma|postsecondary nondegree award|no formal educational credential|some college/i.test(c));
    if (e < 0) continue;
    out[soc] = { title: cells[0]!, education: cells[e]!, experience: cells[e + 1] ?? "None", training: cells[e + 2] ?? "None" };
  }
  const levels = Object.values(out).reduce<Record<string, number>>((m, o) => ((m[o.education] = (m[o.education] ?? 0) + 1), m), {});
  console.log(Object.keys(out).length, "occupations;", levels);
  writeJson(path.join(SEED_DIR, "lifesim", "education.json"), {
    source: { id: "bls-ep-occupational-characteristics", title: "BLS Employment Projections — Occupational projections and worker characteristics (typical entry-level education)", url: URLS[0], license: "Public domain (U.S. federal government work); credit U.S. Bureau of Labor Statistics", checksumSha256: createHash("sha256").update(html).digest("hex") },
    occupations: out,
  });
}
if (process.argv.includes("--parse")) parseEducation();
