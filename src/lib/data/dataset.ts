import type { AreaType, EntityType, ReviewStatus, Source } from "@/lib/domain/schemas";

/**
 * Normalized, table-shaped dataset. One row type per SQL table in
 * supabase/migrations/0001_core_schema.sql. Fixture mode serves this from
 * memory; `npm run db:seed` writes exactly these rows to PostgreSQL.
 */

export type AreaRow = {
  id: string;
  slug: string;
  name: string;
  officialName: string | null;
  areaType: AreaType;
  typeLabel: string | null;
  parentId: string | null;
  geoid: string | null;
  fips: string | null;
  ansi: string | null;
  usps: string | null;
  funcstat: string | null;
  landAreaSqMi: number | null;
  waterAreaSqMi: number | null;
  lat: number | null;
  lon: number | null;
  summary: string | null;
  boundaryNote: string | null;
  programStatus: "active" | "registry_only";
  reviewStatus: ReviewStatus;
  sourceIds: string[];
  aliases: string[];
};

export type AreaRelationRow = {
  id: string;
  areaId: string;
  relatedAreaId: string;
  relationType: string;
  sourceId: string;
  method: string | null;
  reviewStatus: ReviewStatus;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  nameRo: string | null;
  description: string | null;
  parentId: string | null;
  domainNumber: number;
  depth: number;
  sortOrder: number;
};

export type EntityRow = {
  id: string;
  slug: string;
  name: string;
  entityType: EntityType;
  status: "active" | "closed" | "historical" | "unknown";
  shortDescription: string | null;
  officialUrl: string | null;
  sensitiveLocation: boolean;
  visibility: "public" | "hidden" | "draft";
  reviewStatus: ReviewStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  aliases: string[];
  primarySourceId: string | null;
};

export type EntityCategoryRow = { entityId: string; categoryId: string; isPrimary: boolean };

export type EntityAreaRow = {
  entityId: string;
  areaId: string;
  relationType: string;
  reviewStatus: ReviewStatus;
  evidence: string | null;
  verifiedAt: string | null;
  note: string | null;
};

export type EntityRelationRow = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  sourceId: string | null;
  evidence: string | null;
  reviewStatus: ReviewStatus;
  verifiedAt: string | null;
};

export type ExternalIdRow = { entityId: string; provider: string; externalId: string };

export type SourceRow = Source & { entityId: string | null };

export type SourceRecordRow = {
  id: string;
  sourceId: string;
  importRunId: string | null;
  externalRef: string | null;
  retrievedAt: string;
  httpStatus: number | null;
  outcome: string;
  pageTitle: string | null;
  finalUrl: string | null;
  checksumSha256: string | null;
};

export type FactRow = {
  id: string;
  areaId: string | null;
  entityId: string | null;
  key: string;
  valueText: string | null;
  valueNum: number | null;
  unit: string | null;
  asOf: string | null;
  asOfLabel: string | null;
  sourceId: string;
  sourceRef: string | null;
  reviewStatus: ReviewStatus;
  verifiedAt: string | null;
  note: string | null;
};

export type MediaRow = {
  id: string;
  areaId: string | null;
  entityId: string | null;
  kind: "photo" | "ai_visual" | "illustration";
  url: string;
  pageUrl: string;
  alt: string;
  credit: string;
  license: string;
  licenseUrl: string;
  year: number | null;
  aiGenerated: boolean;
};

export type ReviewIssueRow = {
  id: string;
  kind: "claim_unverified" | "relation_unverified" | "location_unverified" | "source_unreachable" | "source_blocked";
  entityId: string | null;
  areaId: string | null;
  sourceId: string | null;
  detail: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
};

export type CoverageUniverseRow = {
  id: string;
  areaId: string;
  label: string;
  definition: string;
  areaType: AreaType | null;
  categoryId: string | null;
  denominator: number;
  asOf: string;
  sourceId: string;
};

export type Dataset = {
  builtAt: string;
  areas: AreaRow[];
  areaRelations: AreaRelationRow[];
  categories: CategoryRow[];
  entities: EntityRow[];
  entityCategories: EntityCategoryRow[];
  entityAreas: EntityAreaRow[];
  entityRelations: EntityRelationRow[];
  externalIds: ExternalIdRow[];
  sources: SourceRow[];
  sourceRecords: SourceRecordRow[];
  facts: FactRow[];
  media: MediaRow[];
  reviewIssues: ReviewIssueRow[];
  coverageUniverses: CoverageUniverseRow[];
};
