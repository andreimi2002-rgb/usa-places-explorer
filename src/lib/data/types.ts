import type { AreaType, EntityType, ReviewStatus } from "@/lib/domain/schemas";
import type { FactRow, MediaRow, SourceRow } from "./dataset";

/** View models returned by every DataProvider implementation. */

export type DataMode = "fixture" | "database";

export type AreaSummary = {
  slug: string;
  name: string;
  areaType: AreaType;
  typeLabel: string | null;
  programStatus: "active" | "registry_only";
  populationEstimate: number | null;
  landAreaSqMi: number | null;
  /** Census Gazetteer internal point, when sourced. */
  lat: number | null;
  lon: number | null;
};

export type Crumb = { slug: string; name: string; areaType: AreaType };

export type AreaDetail = AreaSummary & {
  id: string;
  officialName: string | null;
  geoid: string | null;
  fips: string | null;
  ansi: string | null;
  usps: string | null;
  waterAreaSqMi: number | null;
  boundaryNote: string | null;
  reviewStatus: ReviewStatus;
  aliases: string[];
  breadcrumbs: Crumb[]; // root first, excluding self
  facts: FactRow[];
  sources: SourceRow[];
  media: MediaRow[];
  childCounts: Partial<Record<AreaType, number>>;
  /** Overlapping/related areas (e.g. counties a city intersects). */
  related: { area: AreaSummary; relationType: string; method: string | null; share: number | null; direction: "out" | "in" }[];
  entityCount: number;
};

export type CategoryRef = { slug: string; name: string; nameRo: string | null; domainNumber: number };

export type EntitySummary = {
  slug: string;
  name: string;
  entityType: EntityType;
  shortDescription: string | null;
  reviewStatus: ReviewStatus;
  primaryCategory: CategoryRef;
  domain: CategoryRef;
  placeLabel: string | null;
  /** Best rights-cleared image (photo before logo), for cards. */
  image: { url: string; alt: string } | null;
};

export type LinkedArea = Crumb & { relationType: string; reviewStatus: ReviewStatus; verifiedAt: string | null; evidence: string | null; note: string | null };

export type LinkedEntity = {
  entity: EntitySummary;
  relationType: string;
  direction: "out" | "in";
  reviewStatus: ReviewStatus;
  verifiedAt: string | null;
  evidence: string | null;
  sourceId: string | null;
};

export type SourceCheck = { retrievedAt: string; httpStatus: number | null; outcome: string; pageTitle: string | null };

export type EntityDetail = EntitySummary & {
  id: string;
  status: string;
  officialUrl: string | null;
  sensitiveLocation: boolean;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  categories: (CategoryRef & { isPrimary: boolean; path: CategoryRef[] })[];
  areas: LinkedArea[];
  breadcrumbs: Crumb[];
  relations: LinkedEntity[];
  facts: FactRow[];
  sources: (SourceRow & { lastCheck: SourceCheck | null })[];
  externalIds: { provider: string; externalId: string }[];
  openIssues: number;
  lat: number | null;
  lon: number | null;
  wikidataId: string | null;
  wikipedia: { title: string; url: string; extract: string; retrievedAt: string } | null;
  media: MediaRow[];
  /** Mapped locations per area (brands; OpenStreetMap). */
  presence: { areaSlug: string; areaName: string; count: number; asOf: string | null }[];
};

export type NearbyEntity = EntitySummary & { distanceKm: number };

export type BrandPresence = { entity: EntitySummary; count: number; asOf: string | null };

export type CategoryNode = CategoryRef & {
  id: string;
  description: string | null;
  parentSlug: string | null;
  depth: number;
  children: CategoryNode[];
  /** Entities in this category or any descendant (within the requested scope). */
  entityCount: number;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type EntityQuery = {
  q?: string;
  /** Area scope; includes all descendant areas. */
  areaSlug?: string;
  /** Category scope; includes all descendant categories. */
  categorySlug?: string;
  entityType?: EntityType;
  reviewStatus?: ReviewStatus;
  /** "featured": entries with a photo first, then by type importance (FEATURED_TYPES), then name. Default: relevance/name. */
  sort?: "default" | "featured";
  page?: number;
  pageSize?: number;
};

export type SearchHit =
  | { kind: "entity"; slug: string; name: string; subtitle: string; score: number }
  | { kind: "area"; slug: string; name: string; subtitle: string; score: number }
  | { kind: "category"; slug: string; name: string; subtitle: string; score: number };

export type CoverageCell = {
  domain: CategoryRef;
  total: number;
  byStatus: Record<ReviewStatus, number>;
};

export type CoverageReport = {
  area: Crumb;
  generatedAt: string;
  cells: CoverageCell[];
  totals: Record<ReviewStatus, number> & { all: number };
  universes: {
    id: string;
    label: string;
    definition: string;
    denominator: number;
    numerator: number;
    asOf: string;
    sourceId: string;
  }[];
  openIssues: { kind: string; n: number }[];
};

export type SiteStats = {
  areasByType: Partial<Record<AreaType, number>>;
  entities: number;
  verifiedEntities: number;
  facts: number;
  sources: number;
  categories: number;
  builtAt: string;
};

export interface DataProvider {
  readonly mode: DataMode;
  getStats(): Promise<SiteStats>;
  getArea(slug: string): Promise<AreaDetail | null>;
  listChildAreas(slug: string, opts?: { areaType?: AreaType; q?: string; page?: number; pageSize?: number; deep?: boolean }): Promise<Page<AreaSummary>>;
  getEntity(slug: string): Promise<EntityDetail | null>;
  listEntities(query: EntityQuery): Promise<Page<EntitySummary>>;
  getCategoryTree(scopeAreaSlug?: string): Promise<CategoryNode[]>;
  getCategory(slug: string): Promise<(CategoryNode & { path: CategoryRef[] }) | null>;
  search(q: string, opts?: { limit?: number; areaSlug?: string }): Promise<SearchHit[]>;
  getCoverage(areaSlug: string): Promise<CoverageReport | null>;
  listSources(): Promise<(SourceRow & { lastCheck: SourceCheck | null; usage: number })[]>;
  resolveRedirect(kind: "entity" | "area" | "category", slug: string): Promise<string | null>;
  /** Entities with sourced coordinates within radiusKm of this entity, nearest first. */
  nearbyEntities(slug: string, opts?: { limit?: number; radiusKm?: number }): Promise<NearbyEntity[]>;
  /** Brands with mapped locations in an area (OpenStreetMap counts), largest first. */
  listBrandPresence(areaSlug: string, opts?: { categorySlug?: string; limit?: number }): Promise<BrandPresence[]>;
}

export const REVIEW_STATUSES: ReviewStatus[] = ["imported", "unreviewed", "reviewed", "verified", "stale", "rejected"];
export const emptyStatusCounts = (): Record<ReviewStatus, number> => ({ imported: 0, unreviewed: 0, reviewed: 0, verified: 0, stale: 0, rejected: 0 });

/** Entity types shown first in "featured" listings (same order in fixture and SQL). */
export const FEATURED_TYPES = [
  "museum", "landmark", "venue", "sports_team", "historic_site", "park", "state_park", "protected_area", "zoo", "botanical_garden",
  "university", "shopping_center", "airport", "seaport", "bridge", "lighthouse", "library", "hospital", "college", "waterway", "island", "beach",
];
