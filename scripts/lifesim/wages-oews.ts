/**
 * Life sim data: real wages by occupation for the six game metros.
 * Source: BLS Occupational Employment and Wage Statistics (OEWS), May 2024, MSA file
 * (downloaded by `npm run ingest:agencies`). Output: seed/lifesim/wages.json
 */
import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
import { RAW_DIR, SEED_DIR, writeJson } from "../ingest/lib";
import { METROS } from "./metros";

type Pct = { p10: number | null; p25: number | null; p50: number | null; p75: number | null; p90: number | null; mean: number | null };
type Occ = { soc: string; title: string; group: "total" | "major" | "detailed"; employment: number | null; annual: Pct; hourly: Pct; annualTopCoded: boolean; hourlyOnly: boolean };

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const s = String(typeof v === "object" && v !== null && "result" in v ? (v as { result: unknown }).result : v).replace(/,/g, "").trim();
  if (!s || s === "*" || s === "**" || s === "#") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const zip = path.join(RAW_DIR, "agencies", "oesm24ma.zip");
  if (!existsSync(zip)) throw new Error("Run `npm run ingest:agencies` first (needs A360_CONTACT_EMAIL in .env.local).");
  const bytes = readFileSync(zip);
  const files = unzipSync(new Uint8Array(bytes));
  const key = Object.keys(files).find((k) => k.endsWith("MSA_M2024_dl.xlsx"))!;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(files[key]!) as unknown as ArrayBuffer);
  const ws = wb.worksheets[0]!;
  const header = (ws.getRow(1).values as unknown[]).map((v) => String(v ?? "").trim().toUpperCase());
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`OEWS column ${name} missing`);
    return i;
  };
  const C = Object.fromEntries(["AREA", "AREA_TITLE", "OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", "A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90", "H_MEAN", "H_PCT10", "H_PCT25", "H_MEDIAN", "H_PCT75", "H_PCT90", "HOURLY"].map((n) => [n, col(n)]));

  const wanted = new Map<string, (typeof METROS)[number]>(METROS.map((m) => [m.cbsa, m]));
  const out: Record<string, { cbsa: string; areaTitle: string; occupations: Occ[] }> = {};
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as unknown[];
    const area = String(v[C.AREA!] ?? "").trim();
    const metro = wanted.get(area);
    if (!metro) return;
    const group = String(v[C.O_GROUP!] ?? "").trim().toLowerCase();
    if (!["total", "major", "detailed"].includes(group)) return;
    const rawA = String(v[C.A_PCT90!] ?? "");
    const occ: Occ = {
      soc: String(v[C.OCC_CODE!]).trim(),
      title: String(v[C.OCC_TITLE!]).trim(),
      group: group as Occ["group"],
      employment: num(v[C.TOT_EMP!]),
      annual: { p10: num(v[C.A_PCT10!]), p25: num(v[C.A_PCT25!]), p50: num(v[C.A_MEDIAN!]), p75: num(v[C.A_PCT75!]), p90: num(v[C.A_PCT90!]), mean: num(v[C.A_MEAN!]) },
      hourly: { p10: num(v[C.H_PCT10!]), p25: num(v[C.H_PCT25!]), p50: num(v[C.H_MEDIAN!]), p75: num(v[C.H_PCT75!]), p90: num(v[C.H_PCT90!]), mean: num(v[C.H_MEAN!]) },
      annualTopCoded: rawA.includes("#"),
      hourlyOnly: String(v[C.HOURLY!] ?? "").toUpperCase() === "TRUE",
    };
    (out[metro.slug] ??= { cbsa: area, areaTitle: String(v[C.AREA_TITLE!]).trim(), occupations: [] }).occupations.push(occ);
  });

  for (const m of METROS) {
    const d = out[m.slug];
    if (!d) throw new Error(`No OEWS rows for ${m.name} (CBSA ${m.cbsa})`);
    const all = d.occupations.find((o) => o.group === "total");
    console.log(`${m.name.padEnd(14)} ${d.areaTitle.padEnd(52)} occupations ${String(d.occupations.filter((o) => o.group === "detailed").length).padStart(4)}  all-occ median $${all?.annual.p50?.toLocaleString("en-US")}`);
  }
  writeJson(path.join(SEED_DIR, "lifesim", "wages.json"), {
    source: {
      id: "bls-oews-may-2024-msa", title: "BLS Occupational Employment and Wage Statistics, May 2024 — Metropolitan areas",
      url: "https://www.bls.gov/oes/tables.htm", license: "Public domain (U.S. federal government work); credit U.S. Bureau of Labor Statistics",
      referencePeriod: "May 2024", checksumSha256: createHash("sha256").update(bytes).digest("hex"),
      notes: "Wages are for employed workers. '#' = top-coded (≥ $239,200/yr or $115/hr) stored as null with annualTopCoded=true. Hourly-only occupations (e.g. actors) have no annual figures.",
    },
    metros: out,
  });
  console.log("wrote seed/lifesim/wages.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
