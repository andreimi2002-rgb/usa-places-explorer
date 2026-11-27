import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  censusBundleSchema,
  entitySeedFileSchema,
  linkCheckFileSchema,
  mediaSchema,
  sourceSchema,
  taxonomySchema,
} from "@/lib/domain/schemas";

/** Raw, validated seed inputs. Read from disk at runtime (server only). */
export type SeedInputs = {
  census: z.infer<typeof censusBundleSchema>;
  taxonomy: z.infer<typeof taxonomySchema>;
  curated: z.infer<typeof entitySeedFileSchema>;
  curatedSources: z.infer<typeof sourceSchema>[];
  media: z.infer<typeof mediaSchema>[];
  linkChecks: z.infer<typeof linkCheckFileSchema> | null;
};

export function seedDir(): string {
  return path.join(process.cwd(), "seed");
}

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(path.join(seedDir(), rel), "utf8"));
}

export function loadSeedInputs(): SeedInputs {
  const linkPath = path.join(seedDir(), "generated", "link-checks.json");
  return {
    census: censusBundleSchema.parse(readJson("generated/census-florida.json")),
    taxonomy: taxonomySchema.parse(readJson("taxonomy.json")),
    curated: entitySeedFileSchema.parse(readJson("curated/jacksonville.json")),
    curatedSources: z.object({ sources: z.array(sourceSchema) }).parse(readJson("curated/sources.json")).sources,
    media: z.object({ media: z.array(mediaSchema) }).parse(readJson("curated/media.json")).media,
    linkChecks: existsSync(linkPath) ? linkCheckFileSchema.parse(JSON.parse(readFileSync(linkPath, "utf8"))) : null,
  };
}

export type GeometryFile = {
  generatedAt: string;
  sourceId: string;
  note: string;
  states: GeoJSON.FeatureCollection<GeoJSON.Geometry, { slug: string; name: string }>;
  floridaCounties: GeoJSON.FeatureCollection<GeoJSON.Geometry, { slug: string; name: string }>;
};

let geometryCache: GeometryFile | null = null;
export function loadGeometry(): GeometryFile {
  geometryCache ??= JSON.parse(readFileSync(path.join(seedDir(), "generated", "geometry.json"), "utf8")) as GeometryFile;
  return geometryCache;
}
