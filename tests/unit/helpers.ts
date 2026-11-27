import { buildDataset } from "@/lib/data/build";
import { loadSeedInputs, type SeedInputs } from "@/lib/data/inputs";
import { FixtureProvider } from "@/lib/data/fixture-provider";
import type { Dataset } from "@/lib/data/dataset";

let cachedInputs: SeedInputs | null = null;
let cachedDs: Dataset | null = null;

export function inputs(): SeedInputs {
  cachedInputs ??= loadSeedInputs();
  return cachedInputs;
}

export function dataset(): Dataset {
  cachedDs ??= buildDataset(inputs());
  return cachedDs;
}

export function fixture(): FixtureProvider {
  return new FixtureProvider(dataset());
}
