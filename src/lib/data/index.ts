import { buildDataset } from "./build";
import { FixtureProvider } from "./fixture-provider";
import { loadSeedInputs } from "./inputs";
import { PostgresProvider } from "./postgres-provider";
import type { DataMode, DataProvider } from "./types";

export function dataMode(): DataMode {
  const m = (process.env.DATA_MODE ?? "fixture").trim();
  if (m !== "fixture" && m !== "database") throw new Error(`DATA_MODE must be "fixture" or "database", got "${m}"`);
  return m;
}

const globalForProvider = globalThis as unknown as { __a360Provider?: DataProvider };

/**
 * Server-only data access. Fixture mode serves the attributed seed snapshot from
 * memory; database mode reads PostgreSQL as the read-only role. There is no
 * silent fallback between the two: a misconfigured database mode fails loudly.
 */
export function getProvider(): DataProvider {
  if (globalForProvider.__a360Provider) return globalForProvider.__a360Provider;
  const mode = dataMode();
  let provider: DataProvider;
  if (mode === "database") {
    const url = process.env.DATABASE_READER_URL;
    if (!url) throw new Error("DATA_MODE=database requires DATABASE_READER_URL (see .env.example).");
    provider = new PostgresProvider(url);
  } else {
    provider = new FixtureProvider(buildDataset(loadSeedInputs()));
  }
  globalForProvider.__a360Provider = provider;
  return provider;
}

export type * from "./types";
