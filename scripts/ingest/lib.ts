import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const RAW_DIR = path.join(ROOT, "data", "raw");
export const SEED_DIR = path.join(ROOT, "seed");

export const USER_AGENT = "America360-ingest/0.2 (+https://github.com/andreimi2002-rgb/usa-places-explorer; personal non-commercial research; low request rate)";

export type Downloaded = { file: string; bytes: Buffer; sha256: string; retrievedAt: string; fromCache: boolean };

type Manifest = Record<string, { url: string; sha256: string; retrievedAt: string; bytes: number }>;

function manifestPath(dir: string) {
  return path.join(dir, "manifest.json");
}

function readManifest(dir: string): Manifest {
  const p = manifestPath(dir);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as Manifest) : {};
}

export function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Download a source file once into data/raw/<group>/ and record its checksum
 * and retrieval time in a manifest so runs are reproducible. Pass refresh=true
 * to re-acquire. Raw files are git-ignored; checksums are committed via seed.
 */
export async function acquire(group: string, url: string, opts: { refresh?: boolean } = {}): Promise<Downloaded> {
  const dir = path.join(RAW_DIR, group);
  mkdirSync(dir, { recursive: true });
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "download");
  const file = path.join(dir, name);
  const manifest = readManifest(dir);
  const entry = manifest[name];
  if (!opts.refresh && entry && existsSync(file)) {
    const bytes = readFileSync(file);
    const sum = sha256(bytes);
    if (sum !== entry.sha256) throw new Error(`Checksum mismatch for cached ${name}; rerun with --refresh`);
    return { file, bytes, sha256: sum, retrievedAt: entry.retrievedAt, fromCache: true };
  }
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const retrievedAt = new Date().toISOString();
  const sum = sha256(bytes);
  writeFileSync(file, bytes);
  manifest[name] = { url, sha256: sum, retrievedAt, bytes: bytes.length };
  writeFileSync(manifestPath(dir), JSON.stringify(manifest, null, 2));
  return { file, bytes, sha256: sum, retrievedAt, fromCache: false };
}

/** Split one delimited line, honoring RFC 4180 double-quoted fields. */
export function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseDelimited(text: string, delimiter: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitLine(lines.shift() ?? "", delimiter).map((h) => h.trim());
  return lines.map((line) => {
    const cells = splitLine(line, delimiter);
    if (cells.length !== header.length) throw new Error(`Column count ${cells.length} != ${header.length}: ${line.slice(0, 80)}`);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

export function writeJson(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 1) + "\n");
}

export function hasFlag(flag: string) {
  return process.argv.includes(flag);
}
