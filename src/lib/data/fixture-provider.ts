import { nameKey, normalize, tokens } from "@/lib/text";
import type { AreaType, ReviewStatus } from "@/lib/domain/schemas";
import type { AreaRow, Dataset, EntityRow, MediaRow } from "./dataset";
import { areaSearchText, categoryRef, DatasetIndex, entitySearchText } from "./derive";
import {
  emptyStatusCounts,
  FEATURED_TYPES,
  type AreaDetail,
  type AreaSummary,
  type CategoryNode,
  type CategoryRef,
  type CoverageReport,
  type DataProvider,
  type EntityDetail,
  type EntityQuery,
  type EntitySummary,
  type BrandPresence,
  type NearbyEntity,
  type Page,
  type SearchHit,
  type SiteStats,
  type SourceCheck,
} from "./types";

const AREA_DEPTH_RANK: Record<AreaType, number> = {
  country: 0, state: 1, federal_district: 1, territory: 1, region: 2, metro_area: 2, tribal_area: 2,
  county: 3, municipality: 4, cdp: 4, community: 4, neighborhood: 5,
};
const TRUSTED: ReviewStatus[] = ["verified", "reviewed", "imported"];

export function clampPage(page?: number, pageSize?: number, max = 100) {
  const size = Math.min(Math.max(Math.trunc(pageSize ?? 24), 1), max);
  const p = Math.max(Math.trunc(page ?? 1), 1);
  return { page: p, pageSize: size, offset: (p - 1) * size };
}

/**
 * Area ranking adjustment shared with the SQL in postgres-provider.ts: actively covered
 * places get a small boost; thousands of GNIS named points must not outrank real
 * jurisdictions with the same name (e.g. the "Duval" point vs. Duval County).
 */
export function areaBoost(areaType: AreaType, programStatus: "active" | "registry_only"): number {
  return (programStatus === "active" ? 8 : 0) + (areaType === "community" ? -40 : 0);
}

/** Great-circle distance in km (matches PostGIS geography ST_Distance closely enough for ranking). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

/** Shared scoring so fixture and database search rank comparably. */
export function scoreText(query: string, names: string | string[], doc: string): number {
  const q = normalize(query);
  const qt = tokens(query);
  if (!qt.length) return 0;
  const ns = (Array.isArray(names) ? names : [names]).map(normalize).filter(Boolean);
  const d = normalize(doc);
  if (ns.some((n) => n === q)) return 100;
  if (ns.some((n) => n.startsWith(q))) return 70;
  const nameTokens = ns.flatMap((n) => n.split(" "));
  if (qt.every((t) => nameTokens.some((w) => w.startsWith(t)))) return 50;
  if (qt.every((t) => d.includes(t))) return 25;
  return 0;
}

export class FixtureProvider implements DataProvider {
  readonly mode = "fixture" as const;
  private readonly idx: DatasetIndex;
  private readonly entitySearch = new Map<string, string>();
  private readonly areaSearch = new Map<string, string>();

  constructor(ds: Dataset) {
    this.idx = new DatasetIndex(ds);
    for (const e of ds.entities) this.entitySearch.set(e.id, entitySearchText(this.idx, e));
    for (const a of ds.areas) this.areaSearch.set(a.id, areaSearchText(this.idx, a));
  }

  private get ds() {
    return this.idx.ds;
  }

  private visible(e: EntityRow) {
    return e.visibility === "public" && e.reviewStatus !== "rejected";
  }

  private areaSummary(a: AreaRow): AreaSummary {
    return {
      slug: a.slug, name: a.name, areaType: a.areaType, typeLabel: a.typeLabel, programStatus: a.programStatus,
      populationEstimate: this.idx.populationByArea.get(a.id) ?? null, landAreaSqMi: a.landAreaSqMi, lat: a.lat, lon: a.lon,
    };
  }

  /** Most specific trustworthy area for display ("Jacksonville", "Southside"). */
  private placeOf(e: EntityRow): AreaRow | null {
    const links = this.ds.entityAreas.filter((ea) => ea.entityId === e.id).map((ea) => ({ ea, area: this.idx.areaById.get(ea.areaId)! }));
    if (!links.length) return null;
    links.sort((x, y) => {
      const tx = TRUSTED.includes(x.ea.reviewStatus) ? 1 : 0;
      const ty = TRUSTED.includes(y.ea.reviewStatus) ? 1 : 0;
      if (tx !== ty) return ty - tx;
      return AREA_DEPTH_RANK[y.area.areaType] - AREA_DEPTH_RANK[x.area.areaType] || (x.area.slug < y.area.slug ? -1 : x.area.slug > y.area.slug ? 1 : 0);
    });
    return links[0]!.area;
  }

  private entitySummary(e: EntityRow): EntitySummary {
    const primary = this.ds.entityCategories.find((ec) => ec.entityId === e.id && ec.isPrimary)!;
    const cat = this.idx.categoryById.get(primary.categoryId)!;
    const place = this.placeOf(e);
    const img = this.imageOf(e.id);
    return {
      slug: e.slug, name: e.name, entityType: e.entityType, shortDescription: e.shortDescription, reviewStatus: e.reviewStatus,
      primaryCategory: categoryRef(cat), domain: categoryRef(this.idx.domainOf(cat)), placeLabel: place?.name ?? null,
      image: img ? { url: img.url, alt: img.alt } : null,
      prominence: e.prominence,
    };
  }

  private imageCache: Map<string, MediaRow> | null = null;
  /** Same rule as the SQL view: photos before logos, then lowest id. */
  private imageOf(entityId: string): MediaRow | undefined {
    if (!this.imageCache) {
      this.imageCache = new Map();
      const sorted = this.ds.media
        .filter((m) => m.entityId && !m.aiGenerated)
        .sort((a, b) => Number(b.kind === "photo") - Number(a.kind === "photo") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      for (const m of sorted) if (!this.imageCache.has(m.entityId!)) this.imageCache.set(m.entityId!, m);
    }
    return this.imageCache.get(entityId);
  }

  async nearbyEntities(slug: string, opts: { limit?: number; radiusKm?: number } = {}): Promise<NearbyEntity[]> {
    const e = this.idx.entityBySlug.get(slug);
    if (!e || e.lat === null || e.lon === null || e.sensitiveLocation) return [];
    const limit = Math.min(Math.max(opts.limit ?? 8, 1), 30);
    const radius = Math.min(opts.radiusKm ?? 3, 25);
    const out: { o: EntityRow; d: number }[] = [];
    for (const o of this.ds.entities) {
      if (o.id === e.id || o.lat === null || o.lon === null || o.sensitiveLocation || !this.visible(o)) continue;
      const d = haversineKm(e.lat, e.lon, o.lat, o.lon);
      if (d <= radius) out.push({ o, d });
    }
    return out
      .sort((a, b) => a.d - b.d || (a.o.slug < b.o.slug ? -1 : 1))
      .slice(0, limit)
      .map(({ o, d }) => ({ ...this.entitySummary(o), distanceKm: Math.round(d * 100) / 100 }));
  }

  async listBrandPresence(areaSlug: string, opts: { categorySlug?: string; limit?: number; sort?: "count" | "prominence" } = {}): Promise<BrandPresence[]> {
    const area = this.idx.areaBySlug.get(areaSlug);
    if (!area) return [];
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
    const allowed = opts.categorySlug && this.idx.categoryBySlug.get(opts.categorySlug)
      ? this.idx.descendantCategoryIds(this.idx.categoryBySlug.get(opts.categorySlug)!.id)
      : null;
    // Counts scoped to this exact area; otherwise (e.g. a state) the sum of its counties' counts.
    const counts = this.ds.facts.filter((f) => f.key === "osm-location-count" && f.entityId && f.valueNum !== null);
    let scoped = counts.filter((f) => f.scopeAreaId === area.id);
    if (!scoped.length) {
      const inside = this.idx.descendantAreaIds(area.id);
      scoped = counts.filter((f) => f.scopeAreaId && inside.has(f.scopeAreaId) && this.idx.areaById.get(f.scopeAreaId)!.areaType === "county");
    }
    const byEntity = new Map<string, { n: number; asOf: string | null }>();
    for (const f of scoped) {
      const prev = byEntity.get(f.entityId!) ?? { n: 0, asOf: null };
      byEntity.set(f.entityId!, { n: prev.n + f.valueNum!, asOf: !prev.asOf || (f.asOf && f.asOf > prev.asOf) ? f.asOf : prev.asOf });
    }
    const rows: BrandPresence[] = [];
    for (const [id, v] of byEntity) {
      const e = this.idx.entityById.get(id)!;
      if (!this.visible(e)) continue;
      if (allowed && !this.ds.entityCategories.some((ec) => ec.entityId === e.id && allowed.has(ec.categoryId))) continue;
      rows.push({ entity: this.entitySummary(e), count: v.n, asOf: v.asOf });
    }
    const byName = (a: BrandPresence, b: BrandPresence) => a.entity.name.localeCompare(b.entity.name, "en");
    return rows
      .sort((a, b) => (opts.sort === "prominence" ? b.entity.prominence - a.entity.prominence || b.count - a.count : b.count - a.count) || byName(a, b))
      .slice(0, limit);
  }

  private lastCheck(sourceId: string): SourceCheck | null {
    const recs = this.ds.sourceRecords.filter((r) => r.sourceId === sourceId).sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
    const r = recs[0];
    return r ? { retrievedAt: r.retrievedAt, httpStatus: r.httpStatus, outcome: r.outcome, pageTitle: r.pageTitle } : null;
  }

  private scopedEntities(areaSlug?: string): EntityRow[] {
    const all = this.ds.entities.filter((e) => this.visible(e));
    if (!areaSlug) return all;
    const area = this.idx.areaBySlug.get(areaSlug);
    if (!area) return [];
    const ids = this.idx.descendantAreaIds(area.id);
    const entityIds = new Set(this.ds.entityAreas.filter((ea) => ids.has(ea.areaId) && ea.reviewStatus !== "rejected").map((ea) => ea.entityId));
    return all.filter((e) => entityIds.has(e.id));
  }

  async getStats(): Promise<SiteStats> {
    const areasByType: Partial<Record<AreaType, number>> = {};
    for (const a of this.ds.areas) areasByType[a.areaType] = (areasByType[a.areaType] ?? 0) + 1;
    const visible = this.ds.entities.filter((e) => this.visible(e));
    return {
      areasByType, entities: visible.length, verifiedEntities: visible.filter((e) => e.reviewStatus === "verified").length,
      facts: this.ds.facts.filter((f) => f.reviewStatus !== "rejected").length, sources: this.ds.sources.length,
      categories: this.ds.categories.length, builtAt: this.ds.builtAt,
    };
  }

  async getArea(slug: string): Promise<AreaDetail | null> {
    const a = this.idx.areaBySlug.get(slug);
    if (!a) return null;
    const childCounts: Partial<Record<AreaType, number>> = {};
    for (const c of this.idx.areaChildren.get(a.id) ?? []) childCounts[c.areaType] = (childCounts[c.areaType] ?? 0) + 1;
    const related: AreaDetail["related"] = [];
    for (const r of this.ds.areaRelations) {
      if (r.areaId === a.id) related.push({ area: this.areaSummary(this.idx.areaById.get(r.relatedAreaId)!), relationType: r.relationType, method: r.method, share: r.share, direction: "out" });
      else if (r.relatedAreaId === a.id) related.push({ area: this.areaSummary(this.idx.areaById.get(r.areaId)!), relationType: r.relationType, method: r.method, share: r.share, direction: "in" });
    }
    const facts = this.ds.facts.filter((f) => f.areaId === a.id && f.reviewStatus !== "rejected");
    const sourceIds = new Set([...a.sourceIds, ...facts.map((f) => f.sourceId)]);
    return {
      ...this.areaSummary(a), id: a.id, officialName: a.officialName, geoid: a.geoid, fips: a.fips, ansi: a.ansi, usps: a.usps,
      waterAreaSqMi: a.waterAreaSqMi, boundaryNote: a.boundaryNote, reviewStatus: a.reviewStatus, aliases: a.aliases,
      breadcrumbs: this.idx.crumbs(a), facts, sources: this.ds.sources.filter((s) => sourceIds.has(s.id)),
      media: this.ds.media.filter((m) => m.areaId === a.id), childCounts, related, entityCount: this.scopedEntities(slug).length,
    };
  }

  async listChildAreas(slug: string, opts: { areaType?: AreaType; q?: string; page?: number; pageSize?: number; deep?: boolean } = {}): Promise<Page<AreaSummary>> {
    const a = this.idx.areaBySlug.get(slug);
    const { page, pageSize, offset } = clampPage(opts.page, opts.pageSize, 500);
    if (!a) return { items: [], total: 0, page, pageSize };
    let kids = opts.deep
      ? [...this.idx.descendantAreaIds(a.id)].filter((id) => id !== a.id).map((id) => this.idx.areaById.get(id)!)
      : (this.idx.areaChildren.get(a.id) ?? []);
    if (opts.areaType) kids = kids.filter((k) => k.areaType === opts.areaType);
    if (opts.q) {
      const q = normalize(opts.q);
      kids = kids.filter((k) => nameKey(k.name, k.aliases).includes(q));
    }
    kids = [...kids].sort((x, y) => x.name.localeCompare(y.name, "en"));
    return { items: kids.slice(offset, offset + pageSize).map((k) => this.areaSummary(k)), total: kids.length, page, pageSize };
  }

  async getEntity(slug: string): Promise<EntityDetail | null> {
    const e = this.idx.entityBySlug.get(slug);
    if (!e || !this.visible(e)) return null;
    const summary = this.entitySummary(e);
    const cats = this.ds.entityCategories
      .filter((ec) => ec.entityId === e.id)
      .map((ec) => {
        const c = this.idx.categoryById.get(ec.categoryId)!;
        return { ...categoryRef(c), isPrimary: ec.isPrimary, path: this.idx.categoryPath(c).map(categoryRef) };
      })
      .sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary));
    const areas = this.ds.entityAreas
      .filter((ea) => ea.entityId === e.id)
      .map((ea) => {
        const a = this.idx.areaById.get(ea.areaId)!;
        return { slug: a.slug, name: a.name, areaType: a.areaType, relationType: ea.relationType, reviewStatus: ea.reviewStatus, verifiedAt: ea.verifiedAt, evidence: ea.evidence, note: ea.note };
      })
      .sort((x, y) => AREA_DEPTH_RANK[x.areaType] - AREA_DEPTH_RANK[y.areaType]);
    const relations: EntityDetail["relations"] = [];
    for (const r of this.ds.entityRelations) {
      if (r.reviewStatus === "rejected") continue;
      const other = r.fromEntityId === e.id ? r.toEntityId : r.toEntityId === e.id ? r.fromEntityId : null;
      if (!other) continue;
      const o = this.idx.entityById.get(other)!;
      if (!this.visible(o)) continue;
      relations.push({ entity: this.entitySummary(o), relationType: r.relationType, direction: r.fromEntityId === e.id ? "out" : "in", reviewStatus: r.reviewStatus, verifiedAt: r.verifiedAt, evidence: r.evidence, sourceId: r.sourceId });
    }
    const facts = this.ds.facts.filter((f) => f.entityId === e.id && f.reviewStatus !== "rejected");
    const sourceIds = new Set<string>([...(e.primarySourceId ? [e.primarySourceId] : []), ...facts.map((f) => f.sourceId)]);
    for (const s of this.ds.sources) if (s.entityId === e.id) sourceIds.add(s.id);
    for (const r of this.ds.entityRelations) if (r.fromEntityId === e.id && r.sourceId) sourceIds.add(r.sourceId);
    const place = this.placeOf(e);
    return {
      ...summary, id: e.id, status: e.status, officialUrl: e.officialUrl, sensitiveLocation: e.sensitiveLocation, aliases: e.aliases,
      createdAt: e.createdAt, updatedAt: e.updatedAt, verifiedAt: e.verifiedAt, categories: cats, areas,
      breadcrumbs: place ? this.idx.crumbs(place, true) : [], relations, facts,
      sources: this.ds.sources.filter((s) => sourceIds.has(s.id)).map((s) => ({ ...s, lastCheck: this.lastCheck(s.id) })),
      externalIds: this.ds.externalIds.filter((x) => x.entityId === e.id).map((x) => ({ provider: x.provider, externalId: x.externalId })),
      openIssues: this.ds.reviewIssues.filter((i) => i.entityId === e.id && i.status === "open").length,
      lat: e.sensitiveLocation ? null : e.lat, lon: e.sensitiveLocation ? null : e.lon, wikidataId: e.wikidataId, wikipedia: e.wikipedia,
      presence: this.ds.facts
        .filter((f) => f.entityId === e.id && f.key === "osm-location-count" && f.scopeAreaId && f.valueNum !== null)
        .map((f) => ({ areaSlug: this.idx.areaById.get(f.scopeAreaId!)!.slug, areaName: this.idx.areaById.get(f.scopeAreaId!)!.name, count: f.valueNum!, asOf: f.asOf }))
        .sort((x, y) => y.count - x.count || (x.areaSlug < y.areaSlug ? -1 : 1)),
      media: this.ds.media.filter((m) => m.entityId === e.id).sort((a, b) => Number(b.kind === "photo") - Number(a.kind === "photo") || (a.id < b.id ? -1 : 1)),
    };
  }

  async listEntities(query: EntityQuery): Promise<Page<EntitySummary>> {
    const { page, pageSize, offset } = clampPage(query.page, query.pageSize);
    let rows = this.scopedEntities(query.areaSlug);
    if (query.areaSlug && !this.idx.areaBySlug.has(query.areaSlug)) rows = [];
    if (query.categorySlug) {
      const cat = this.idx.categoryBySlug.get(query.categorySlug);
      const ids = cat ? this.idx.descendantCategoryIds(cat.id) : new Set<string>();
      const ents = new Set(this.ds.entityCategories.filter((ec) => ids.has(ec.categoryId)).map((ec) => ec.entityId));
      rows = rows.filter((e) => ents.has(e.id));
    }
    if (query.entityType) rows = rows.filter((e) => e.entityType === query.entityType);
    if (query.excludeEntityType) rows = rows.filter((e) => e.entityType !== query.excludeEntityType);
    if (query.reviewStatus) rows = rows.filter((e) => e.reviewStatus === query.reviewStatus);
    let scored = rows.map((e) => ({ e, s: query.q ? scoreText(query.q, [e.name, ...e.aliases], this.entitySearch.get(e.id)!) : 1 }));
    if (query.q) scored = scored.filter((x) => x.s > 0);
    if (query.sort === "featured") {
      const rank = (t: string) => (FEATURED_TYPES.indexOf(t) === -1 ? 999 : FEATURED_TYPES.indexOf(t));
      scored.sort((a, b) => b.s - a.s || b.e.prominence - a.e.prominence || Number(!!this.imageOf(b.e.id)) - Number(!!this.imageOf(a.e.id)) || rank(a.e.entityType) - rank(b.e.entityType) || a.e.name.localeCompare(b.e.name, "en"));
    } else scored.sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name, "en"));
    return { items: scored.slice(offset, offset + pageSize).map((x) => this.entitySummary(x.e)), total: scored.length, page, pageSize };
  }

  private buildTree(scopeAreaSlug?: string): CategoryNode[] {
    const scoped = new Set(this.scopedEntities(scopeAreaSlug).map((e) => e.id));
    const byCat = new Map<string, Set<string>>();
    for (const ec of this.ds.entityCategories) {
      if (!scoped.has(ec.entityId)) continue;
      for (const c of this.idx.categoryPath(this.idx.categoryById.get(ec.categoryId)!)) {
        if (!byCat.has(c.id)) byCat.set(c.id, new Set());
        byCat.get(c.id)!.add(ec.entityId);
      }
    }
    const make = (c: (typeof this.ds.categories)[number]): CategoryNode => ({
      ...categoryRef(c), id: c.id, description: c.description, depth: c.depth,
      parentSlug: c.parentId ? this.idx.categoryById.get(c.parentId)!.slug : null,
      children: (this.idx.categoryChildren.get(c.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map(make),
      entityCount: byCat.get(c.id)?.size ?? 0,
    });
    return this.ds.categories.filter((c) => !c.parentId).sort((a, b) => a.domainNumber - b.domainNumber).map(make);
  }

  async getCategoryTree(scopeAreaSlug?: string): Promise<CategoryNode[]> {
    return this.buildTree(scopeAreaSlug);
  }

  async getCategory(slug: string): Promise<(CategoryNode & { path: CategoryRef[] }) | null> {
    const c = this.idx.categoryBySlug.get(slug);
    if (!c) return null;
    const find = (nodes: CategoryNode[]): CategoryNode | null => {
      for (const n of nodes) {
        if (n.slug === slug) return n;
        const f = find(n.children);
        if (f) return f;
      }
      return null;
    };
    const node = find(this.buildTree());
    return node ? { ...node, path: this.idx.categoryPath(c).map(categoryRef) } : null;
  }

  async search(q: string, opts: { limit?: number; areaSlug?: string } = {}): Promise<SearchHit[]> {
    const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
    if (!tokens(q).length) return [];
    const hits: SearchHit[] = [];
    for (const e of this.scopedEntities(opts.areaSlug)) {
      const s = scoreText(q, [e.name, ...e.aliases], this.entitySearch.get(e.id)!);
      if (s > 0) {
        const sum = this.entitySummary(e);
        hits.push({ kind: "entity", slug: e.slug, name: e.name, subtitle: [sum.primaryCategory.name, sum.placeLabel].filter(Boolean).join(" · "), score: s + 5 });
      }
    }
    const scopeIds = opts.areaSlug && this.idx.areaBySlug.get(opts.areaSlug) ? this.idx.descendantAreaIds(this.idx.areaBySlug.get(opts.areaSlug)!.id) : null;
    for (const a of this.ds.areas) {
      if (scopeIds && !scopeIds.has(a.id)) continue;
      const s = scoreText(q, [a.name, ...a.aliases], this.areaSearch.get(a.id)!);
      if (s > 0) {
        const parent = a.parentId ? this.idx.areaById.get(a.parentId)?.name : null;
        hits.push({ kind: "area", slug: a.slug, name: a.name, subtitle: [a.typeLabel, parent].filter(Boolean).join(" · "), score: s + areaBoost(a.areaType, a.programStatus) });
      }
    }
    for (const c of this.ds.categories) {
      const s = scoreText(q, c.name, `${c.name} ${c.nameRo ?? ""} ${c.description ?? ""}`);
      if (s > 0) hits.push({ kind: "category", slug: c.slug, name: c.name, subtitle: c.parentId ? this.idx.domainOf(c).name : "Domain", score: s });
    }
    return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "en")).slice(0, limit);
  }

  async getCoverage(areaSlug: string): Promise<CoverageReport | null> {
    const area = this.idx.areaBySlug.get(areaSlug);
    if (!area) return null;
    const ents = this.scopedEntities(areaSlug);
    const domains = this.ds.categories.filter((c) => !c.parentId).sort((a, b) => a.domainNumber - b.domainNumber);
    const cells = domains.map((d) => ({ domain: categoryRef(d), total: 0, byStatus: emptyStatusCounts() }));
    const totals = { ...emptyStatusCounts(), all: 0 };
    for (const e of ents) {
      const sum = this.entitySummary(e);
      const cell = cells.find((c) => c.domain.slug === sum.domain.slug)!;
      cell.total++;
      cell.byStatus[e.reviewStatus]++;
      totals[e.reviewStatus]++;
      totals.all++;
    }
    const scope = this.idx.descendantAreaIds(area.id);
    const universes = this.ds.coverageUniverses
      .filter((u) => scope.has(u.areaId))
      .map((u) => ({
        id: u.id, label: u.label, definition: u.definition, denominator: u.denominator, asOf: u.asOf, sourceId: u.sourceId,
        numerator: this.ds.areas.filter((a) => a.areaType === u.areaType && this.idx.descendantAreaIds(u.areaId).has(a.id) && a.id !== u.areaId && (u.metric === "area_count" || this.ds.areaRelations.some((r) => r.areaId === a.id && r.relationType === u.relationType))).length,
      }));
    const entIds = new Set(ents.map((e) => e.id));
    const issueCounts = new Map<string, number>();
    for (const i of this.ds.reviewIssues) if (i.status === "open" && i.entityId && entIds.has(i.entityId)) issueCounts.set(i.kind, (issueCounts.get(i.kind) ?? 0) + 1);
    return {
      area: { slug: area.slug, name: area.name, areaType: area.areaType }, generatedAt: this.ds.builtAt, cells, totals, universes,
      openIssues: [...issueCounts].map(([kind, n]) => ({ kind, n })).sort((a, b) => b.n - a.n),
    };
  }

  async listSources() {
    const usage = new Map<string, number>();
    const bump = (id: string | null) => id && usage.set(id, (usage.get(id) ?? 0) + 1);
    this.ds.facts.forEach((f) => bump(f.sourceId));
    this.ds.areas.forEach((a) => a.sourceIds.forEach(bump));
    this.ds.entities.forEach((e) => bump(e.primarySourceId));
    this.ds.entityRelations.forEach((r) => bump(r.sourceId));
    return this.ds.sources.map((s) => ({ ...s, lastCheck: this.lastCheck(s.id), usage: usage.get(s.id) ?? 0 }));
  }

  async resolveRedirect(): Promise<string | null> {
    return null; // Fixture data has no merged slugs yet; database mode reads slug_redirects.
  }
}
