import { z } from "zod";

/**
 * Canonical record schemas. Every seed file, every import adapter and the
 * fixture provider validate against these. The SQL schema in
 * supabase/migrations mirrors them (see docs/DATA_DICTIONARY.md).
 */

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const reviewStatusSchema = z.enum([
  "imported", // loaded from a registered source, not yet reviewed by a person
  "unreviewed", // editorial/curated placement or claim, pending review
  "reviewed", // a person reviewed it against the cited source
  "verified", // machine- or human-confirmed against the cited source on a date
  "stale", // previously confirmed, evidence is now outdated or failing
  "rejected", // reviewed and rejected; never shown as fact
]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const visibilitySchema = z.enum(["public", "hidden", "draft"]);

// ---------------------------------------------------------------- sources
export const sourceKindSchema = z.enum(["dataset", "official_website", "directory", "reference"]);

export const sourceSchema = z.object({
  id: slugSchema,
  kind: sourceKindSchema,
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  datasetVersion: z.string().optional(),
  license: z.string().min(1),
  termsUrl: z.string().url().optional(),
  redisplayPermitted: z.boolean(),
  coverage: z.string().optional(),
  expectedFields: z.array(z.string()).default([]),
  retrievalMethod: z.string().optional(),
  refreshInterval: z.string().optional(),
  limitations: z.string().optional(),
  retrievedAt: isoDateTimeSchema.optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

// ---------------------------------------------------------------- geography
export const areaTypeSchema = z.enum([
  "country",
  "state",
  "federal_district",
  "territory",
  "county",
  "municipality",
  "cdp",
  "community",
  "neighborhood",
  "region",
  "metro_area",
  "tribal_area",
]);
export type AreaType = z.infer<typeof areaTypeSchema>;

export const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export type Point = z.infer<typeof pointSchema>;

export const areaSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  /** Official full name, e.g. "Jacksonville city" (Census NAME). */
  officialName: z.string().optional(),
  areaType: areaTypeSchema,
  /** Census LSAD-style descriptor (city, town, village, CDP, County). */
  typeLabel: z.string().optional(),
  /** Primary hierarchical parent used for breadcrumbs; overlaps go in areaRelations. */
  parentSlug: slugSchema.optional(),
  codes: z
    .object({
      geoid: z.string().optional(),
      fips: z.string().optional(),
      ansi: z.string().optional(),
      usps: z.string().optional(),
      funcstat: z.string().optional(),
    })
    .default({}),
  landAreaSqMi: z.number().nonnegative().optional(),
  waterAreaSqMi: z.number().nonnegative().optional(),
  internalPoint: pointSchema.optional(),
  summary: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  sourceIds: z.array(slugSchema).min(1),
  reviewStatus: reviewStatusSchema,
  /** Set when the area has no official boundary (e.g. informal neighborhoods). */
  boundaryNote: z.string().optional(),
  /** Activation status of the encyclopedia program for this area. */
  programStatus: z.enum(["active", "registry_only"]).default("registry_only"),
});
export type Area = z.infer<typeof areaSchema>;

export const areaRelationTypeSchema = z.enum(["intersects", "contains_internal_point_of", "adjacent_to", "consolidated_with", "county_seat"]);

export const areaRelationSchema = z.object({
  areaSlug: slugSchema,
  relatedSlug: slugSchema,
  relationType: areaRelationTypeSchema,
  sourceId: slugSchema,
  method: z.string().optional(),
  /** Share of areaSlug's area inside relatedSlug (0..1), for geometric intersections. */
  share: z.number().min(0).max(1).optional(),
  reviewStatus: reviewStatusSchema,
});
export type AreaRelation = z.infer<typeof areaRelationSchema>;

// ---------------------------------------------------------------- taxonomy
export type CategoryInput = {
  slug: string;
  name: string;
  nameRo?: string;
  description?: string;
  children?: CategoryInput[];
};

export const categoryInputSchema: z.ZodType<CategoryInput> = z.lazy(() =>
  z.object({
    slug: slugSchema,
    name: z.string().min(1),
    nameRo: z.string().optional(),
    description: z.string().optional(),
    children: z.array(categoryInputSchema).optional(),
  }),
);

export const taxonomySchema = z.object({
  version: z.string(),
  domains: z.array(categoryInputSchema).length(24),
});

// ---------------------------------------------------------------- facts
export const factValueSchema = z.union([z.string(), z.number()]);

export const factSchema = z.object({
  subjectKind: z.enum(["area", "entity"]),
  subjectSlug: slugSchema,
  key: slugSchema,
  value: factValueSchema,
  unit: z.string().optional(),
  /** Date the value describes (valid/as-of), distinct from publication and retrieval. */
  asOf: isoDateSchema.optional(),
  asOfLabel: z.string().optional(),
  sourceId: slugSchema,
  /** Pointer into the source (row id, GEOID, field name). */
  sourceRef: z.string().optional(),
  reviewStatus: reviewStatusSchema,
  note: z.string().optional(),
});
export type Fact = z.infer<typeof factSchema>;

// ---------------------------------------------------------------- entities
export const entityTypeSchema = z.enum([
  "government_body",
  "agency",
  "law_enforcement_agency",
  "fire_rescue_agency",
  "library_system",
  "school_district",
  "university",
  "college",
  "hospital",
  "company",
  "brand",
  "economic_development_org",
  "store",
  "shopping_center",
  "shopping_district",
  "restaurant",
  "food_hall",
  "dining_district",
  "park",
  "state_park",
  "protected_area",
  "botanical_garden",
  "zoo",
  "trail",
  "promenade",
  "species",
  "waterway",
  "sports_team",
  "venue",
  "airport",
  "seaport",
  "transit_agency",
  "bridge",
  "highway",
  "museum",
  "historic_site",
  "landmark",
  // enrichment (Wikidata) types
  "school",
  "library",
  "military_installation",
  "transit_station",
  "lighthouse",
  "cemetery",
  "place_of_worship",
  "media_outlet",
  "hotel",
  "building",
  "island",
  "beach",
  "organization",
]);
export type EntityType = z.infer<typeof entityTypeSchema>;

export const entityAreaRelationSchema = z.enum([
  "located_in",
  "headquartered_in",
  "serves",
  "operates_in",
  "crosses",
  "documented_in",
]);

export const entityRelationTypeSchema = z.enum([
  "home_venue",
  "operated_by",
  "brand_of",
  "affiliated_with",
  "part_of",
  "on_waterway",
  "crosses",
  "managed_by",
]);
export type EntityRelationType = z.infer<typeof entityRelationTypeSchema>;

export const claimSchema = z.object({
  key: slugSchema,
  value: factValueSchema,
  unit: z.string().optional(),
  /** Source that should contain the evidence; defaults to the entity website source. */
  sourceId: slugSchema.optional(),
  /** Text expected verbatim in the source document; checked by `npm run ingest:links`. */
  evidence: z.string().min(3),
});
export type Claim = z.infer<typeof claimSchema>;

export const entityInputSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  entityType: entityTypeSchema,
  status: z.enum(["active", "closed", "historical", "unknown"]).default("unknown"),
  shortDescription: z.string().max(280).optional(),
  officialUrl: z.string().url().optional(),
  categories: z.array(z.object({ slug: slugSchema, primary: z.boolean().default(false) })).min(1),
  areas: z
    .array(
      z.object({
        slug: slugSchema,
        relation: entityAreaRelationSchema,
        reviewStatus: reviewStatusSchema.default("unreviewed"),
        /** Text expected in the entity's source page; a match marks the link machine-verified. */
        evidence: z.string().min(3).optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
  relations: z
    .array(
      z.object({
        to: slugSchema,
        type: entityRelationTypeSchema,
        claimEvidence: z.string().optional(),
        sourceId: slugSchema.optional(),
      }),
    )
    .default([]),
  claims: z.array(claimSchema).default([]),
  /** Additional sources documenting the entity (dataset/directory ids). */
  sourceIds: z.array(slugSchema).default([]),
  externalIds: z.array(z.object({ provider: z.string(), id: z.string() })).default([]),
  /** Sensitive entities (e.g. species) never get precise public coordinates. */
  sensitiveLocation: z.boolean().default(false),
  visibility: visibilitySchema.default("public"),
});
export type EntityInput = z.infer<typeof entityInputSchema>;

export const entitySeedFileSchema = z.object({
  scope: z.string(),
  curatedBy: z.string(),
  curatedAt: isoDateSchema,
  entities: z.array(entityInputSchema),
  neighborhoods: z.array(areaSchema).default([]),
});

// ---------------------------------------------------------------- media
export const mediaSchema = z.object({
  id: slugSchema,
  subjectKind: z.enum(["area", "entity"]),
  subjectSlug: slugSchema,
  kind: z.enum(["photo", "ai_visual", "illustration"]),
  url: z.string().url(),
  pageUrl: z.string().url(),
  alt: z.string().min(5),
  credit: z.string().min(1),
  license: z.string().min(1),
  licenseUrl: z.string().url(),
  year: z.number().int().optional(),
  aiGenerated: z.boolean(),
});
export type Media = z.infer<typeof mediaSchema>;

// ---------------------------------------------------------------- link checks
export const linkCheckSchema = z.object({
  sourceId: slugSchema,
  url: z.string().url(),
  checkedAt: isoDateTimeSchema,
  httpStatus: z.number().int().nullable(),
  finalUrl: z.string().nullable(),
  pageTitle: z.string().nullable(),
  outcome: z.enum(["ok", "blocked", "not_found", "error", "redirected_offsite"]),
  bodySha256: z.string().nullable(),
  evidence: z.array(z.object({ text: z.string(), found: z.boolean() })),
});
export type LinkCheck = z.infer<typeof linkCheckSchema>;

export const linkCheckFileSchema = z.object({
  generatedAt: isoDateTimeSchema,
  userAgent: z.string(),
  checks: z.array(linkCheckSchema),
});

// ---------------------------------------------------------------- coverage universe
export const coverageUniverseSchema = z.object({
  id: slugSchema,
  areaSlug: slugSchema,
  label: z.string(),
  /** What is counted, precisely. */
  definition: z.string(),
  areaType: areaTypeSchema.optional(),
  categorySlug: slugSchema.optional(),
  denominator: z.number().int().positive(),
  asOf: isoDateSchema,
  sourceId: slugSchema,
  /** area_count: areas of areaType under areaSlug; relation_count: those areas having relationType. */
  metric: z.enum(["area_count", "relation_count"]).default("area_count"),
  relationType: areaRelationTypeSchema.optional(),
});
export type CoverageUniverse = z.infer<typeof coverageUniverseSchema>;

export const censusBundleSchema = z.object({
  generatedAt: isoDateTimeSchema,
  generator: z.string(),
  sources: z.array(sourceSchema),
  areas: z.array(areaSchema),
  areaRelations: z.array(areaRelationSchema),
  facts: z.array(factSchema),
  coverageUniverses: z.array(coverageUniverseSchema),
});
export type CensusBundle = z.infer<typeof censusBundleSchema>;

/**
 * Phase 2 geography bundle (scripts/ingest/florida-geography.ts): exact
 * place/county intersections from boundary polygons, county seats and
 * websites, and GNIS named populated places. Applied on top of the Census bundle.
 */
export const geographyBundleSchema = censusBundleSchema.extend({
  /** Primary-parent changes for existing areas (e.g. CDP -> county with the largest area share). */
  parentOverrides: z.array(z.object({ slug: slugSchema, parentSlug: slugSchema, reason: z.string() })),
  /** Existing areas that receive a GNIS id / point (e.g. curated neighborhoods). */
  areaEnrichments: z.array(
    z.object({ slug: slugSchema, ansi: z.string(), internalPoint: pointSchema, sourceId: slugSchema }),
  ),
  /** Census places whose relations are now geometric (drop the bundle-1 approximations). */
  placesWithGeometry: z.array(slugSchema),
  stats: z.record(z.string(), z.number()),
});
export type GeographyBundle = z.infer<typeof geographyBundleSchema>;

// ---------------------------------------------------------------- enrichment (Wikidata / Wikipedia / Commons / OSM)
export const enrichedEntitySchema = z.object({
  qid: z.string().regex(/^Q\d+$/),
  slug: slugSchema,
  /** When set, this record enriches an existing curated entity instead of creating one. */
  curatedSlug: slugSchema.optional(),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  entityType: z.string().min(1),
  status: z.enum(["active", "closed", "historical", "unknown"]),
  origin: z.enum(["wikidata-place", "osm-brand"]),
  /** Number of Wikipedia language editions with an article (Wikidata sitelinks): how well known it is. */
  prominence: z.number().int().nonnegative().default(0),
  categories: z.array(z.object({ slug: slugSchema, primary: z.boolean() })).min(1),
  areas: z.array(z.object({ slug: slugSchema, relation: z.enum(["located_in", "headquartered_in", "operates_in"]) })).min(1),
  coords: pointSchema.optional(),
  officialUrl: z.string().url().optional(),
  wikipedia: z.object({ title: z.string(), url: z.string().url(), extract: z.string(), retrievedAt: isoDateTimeSchema }).optional(),
  facts: z.array(
    z.object({
      key: slugSchema,
      value: z.union([z.string(), z.number()]),
      unit: z.string().optional(),
      asOf: isoDateSchema.optional(),
      sourceId: slugSchema,
      sourceRef: z.string(),
      scopeAreaSlug: slugSchema.optional(),
    }),
  ),
  relations: z.array(z.object({ type: z.enum(["operated_by", "home_venue", "part_of", "brand_of", "managed_by", "affiliated_with"]), targetQid: z.string() })),
  externalIds: z.array(z.object({ provider: z.string(), id: z.string() })),
  media: z.array(
    z.object({
      kind: z.enum(["photo", "illustration"]),
      url: z.string().url(),
      pageUrl: z.string().url(),
      alt: z.string().min(5),
      credit: z.string().min(1),
      license: z.string().min(1),
      licenseUrl: z.string().url(),
    }),
  ),
});
export type EnrichedEntity = z.infer<typeof enrichedEntitySchema>;

export const enrichmentBundleSchema = z.object({
  generatedAt: isoDateTimeSchema,
  generator: z.string(),
  areaSlug: slugSchema,
  sources: z.array(sourceSchema),
  entities: z.array(enrichedEntitySchema),
  stats: z.record(z.string(), z.union([z.number(), z.string()])),
});
export type EnrichmentBundle = z.infer<typeof enrichmentBundleSchema>;
