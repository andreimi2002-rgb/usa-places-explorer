import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  censusBundleSchema,
  geographyBundleSchema,
  entitySeedFileSchema,
  linkCheckFileSchema,
  mediaSchema,
  sourceSchema,
  taxonomySchema,
} from "@/lib/domain/schemas";

/** Raw, validated seed inputs. Read from disk at runtime (server only). */
export type SeedInputs = {
  census: z.infer<typeof censusBundleSchema>;
  /** Phase 2 geography bundle; optional so a checkout without it still builds. */
  geography: z.infer<typeof geographyBundleSchema> | null;
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
  const geoPath = path.join(seedDir(), "generated", "florida-geography.json");
  return {
    census: censusBundleSchema.parse(readJson("generated/census-florida.json")),
    geography: existsSync(geoPath) ? geographyBundleSchema.parse(JSON.parse(readFileSync(geoPath, "utf8"))) : null,
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

export type PlaceGeometryFile = {
  generatedAt: string;
  sourceId: string;
  note: string;
  places: GeoJSON.FeatureCollection<GeoJSON.Geometry, { slug: string; geoid: string }>;
};

let placeGeometryCache: Map<string, GeoJSON.Feature<GeoJSON.Geometry, { slug: string; name: string }>> | null = null;
/** Simplified place boundaries keyed by area slug (empty map if the Phase 2 file is absent). */
export function loadPlaceGeometry(): Map<string, GeoJSON.Feature<GeoJSON.Geometry, { slug: string; name: string }>> {
  if (placeGeometryCache) return placeGeometryCache;
  const p = path.join(seedDir(), "generated", "place-geometry.json");
  placeGeometryCache = new Map();
  if (existsSync(p)) {
    const file = JSON.parse(readFileSync(p, "utf8")) as PlaceGeometryFile;
    for (const f of file.places.features) placeGeometryCache.set(f.properties.slug, { ...f, properties: { slug: f.properties.slug, name: f.properties.slug } });
  }
  return placeGeometryCache;
}

let geometryCache: GeometryFile | null = null;
export function loadGeometry(): GeometryFile {
  geometryCache ??= JSON.parse(readFileSync(path.join(seedDir(), "generated", "geometry.json"), "utf8")) as GeometryFile;
  return geometryCache;
}
