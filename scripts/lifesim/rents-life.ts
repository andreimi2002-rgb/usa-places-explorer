/**
 * Life sim data from files the owner downloaded manually (agencies block automated access):
 *  - HUD Fair Market Rents FY2026 (data/raw/agencies/FY26_FMRs.xlsx)  -> seed/lifesim/rents.json
 *  - SSA period life table (data/raw/agencies/Actuarial Life Table.html) -> seed/lifesim/life-table.json
 */
import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { RAW_DIR, SEED_DIR, writeJson } from "../ingest/lib";

const DIR = path.join(RAW_DIR, "agencies");
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

/** Anchor county (5-digit FIPS) whose HUD rent area represents each metro's core. */
const RENT_COUNTY: Record<string, { fips: string; county: string }> = {
  jacksonville: { fips: "12031", county: "Duval County" },
  orlando: { fips: "12095", county: "Orange County" },
  miami: { fips: "12086", county: "Miami-Dade County" },
  tampa: { fips: "12057", county: "Hillsborough County" },
  destin: { fips: "12091", county: "Okaloosa County" },
  tallahassee: { fips: "12073", county: "Leon County" },
};

async function rents() {
  const file = path.join(DIR, "FY26_FMRs.xlsx");
  const bytes = readFileSync(file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  const ws = wb.worksheets[0]!;
  const header = (ws.getRow(1).values as unknown[]).map((v) => String(v ?? "").trim().toLowerCase());
  const find = (...names: string[]) => {
    const i = header.findIndex((h) => names.includes(h));
    if (i < 0) throw new Error(`FMR column ${names.join("/")} missing; header: ${header.join(",")}`);
    return i;
  };
  const cFips = find("fips", "fips2010", "fips2020");
  const cArea = find("hud_area_name", "areaname");
  const cCounty = find("countyname", "county_name");
  const beds = [0, 1, 2, 3, 4].map((b) => find(`fmr_${b}`, `fmr${b}`));
  const out: Record<string, unknown> = {};
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const v = row.values as unknown[];
    const fips5 = String(v[cFips] ?? "").slice(0, 5);
    const metro = Object.entries(RENT_COUNTY).find(([, c]) => c.fips === fips5)?.[0];
    if (!metro || out[metro]) return;
    const [studio, br1, br2, br3, br4] = beds.map((c) => Number(v[c]));
    out[metro] = { hudArea: String(v[cArea]).trim(), county: String(v[cCounty]).trim(), monthly: { studio, br1, br2, br3, br4 } };
  });
  for (const m of Object.keys(RENT_COUNTY)) if (!out[m]) throw new Error(`no FMR row for ${m}`);
  for (const [m, r] of Object.entries(out)) console.log(`${m.padEnd(13)} ${(r as { hudArea: string }).hudArea.padEnd(55)} 1BR $${(r as { monthly: { br1: number } }).monthly.br1}  2BR $${(r as { monthly: { br2: number } }).monthly.br2}`);
  writeJson(path.join(SEED_DIR, "lifesim", "rents.json"), {
    source: {
      id: "hud-fmr-fy2026", title: "HUD Fair Market Rents, FY2026", url: "https://www.huduser.gov/portal/datasets/fmr.html",
      license: "Public domain (U.S. federal government work); credit U.S. Department of Housing and Urban Development", checksumSha256: sha(bytes),
      notes: "FMRs are gross rents (rent + utilities) at about the 40th percentile of standard-quality rentals in the area. Each metro uses its anchor county's HUD area (Miami: Miami-Dade HMFA).",
    },
    metros: out,
  });
}

function lifeTable() {
  const file = readdirSync(DIR).find((f) => /actuarial life table|table4c6/i.test(f) && f.endsWith(".html"));
  if (!file) throw new Error("SSA life table HTML not found in data/raw/agencies");
  const html = readFileSync(path.join(DIR, file), "utf8");
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const year = text.match(/period life table for (?:the )?(\d{4})/i)?.[1] ?? text.match(/(\d{4}) period life table/i)?.[1] ?? null;
  const start = text.indexOf("Exact age");
  const nums = text.slice(start).match(/-?\d[\d,]*\.?\d*/g)!.map((s) => Number(s.replace(/,/g, "")));
  const rows: { age: number; male: { q: number; lives: number; ex: number }; female: { q: number; lives: number; ex: number } }[] = [];
  for (let i = 0; i + 6 < nums.length; ) {
    const age = nums[i]!;
    if (age !== rows.length) break; // ages run 0..119 consecutively
    rows.push({ age, male: { q: nums[i + 1]!, lives: nums[i + 2]!, ex: nums[i + 3]! }, female: { q: nums[i + 4]!, lives: nums[i + 5]!, ex: nums[i + 6]! } });
    i += 7;
  }
  if (rows.length < 100) throw new Error(`life table parse failed (${rows.length} rows)`);
  console.log(`life table ${year ?? "(year not found)"}: ${rows.length} ages; e0 male ${rows[0]!.male.ex}, female ${rows[0]!.female.ex}; q(65) male ${rows[65]!.male.q}`);
  writeJson(path.join(SEED_DIR, "lifesim", "life-table.json"), {
    source: { id: "ssa-period-life-table", title: `SSA Actuarial Life Table${year ? ` (period life table, ${year})` : ""}`, url: "https://www.ssa.gov/oact/STATS/table4c6.html", license: "Public domain (U.S. federal government work); credit Social Security Administration", checksumSha256: sha(html), year },
    columns: "q = probability of dying within one year; lives = survivors of 100,000 births; ex = remaining life expectancy (years)",
    ages: rows,
  });
}

async function main() {
  await rents();
  lifeTable();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
