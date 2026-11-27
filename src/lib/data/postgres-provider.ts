import pg from "pg";
import type { AreaType, EntityType, ReviewStatus } from "@/lib/domain/schemas";
import { normalize, tokens } from "@/lib/text";
import type { FactRow, MediaRow, SourceRow } from "./dataset";
import { clampPage, scoreText } from "./fixture-provider";
import {
  emptyStatusCounts,
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

/**
 * Database mode. Every query is parameterized, bounded and runs as the
 * least-privilege a360_reader role, so row-level security applies.
 */

type R = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : String(v));
const isoDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v === null || v === undefined ? null : String(v).slice(0, 10));

const AREA_SUMMARY_COLS = `a.slug, a.name, a.area_type, a.type_label, a.program_status, a.land_area_sqmi,
  st_y(a.internal_point::geometry) as lat, st_x(a.internal_point::geometry) as lon,
  (select population_estimate from area_populations p where p.area_id = a.id order by as_of desc nulls last limit 1) as population_estimate`;

function areaSummary(r: R): AreaSummary {
  return {
    slug: String(r.slug), name: String(r.name), areaType: r.area_type as AreaType, typeLabel: (r.type_label as string) ?? null,
    programStatus: r.program_status as AreaSummary["programStatus"], populationEstimate: num(r.population_estimate), landAreaSqMi: num(r.land_area_sqmi),
    lat: num(r.lat), lon: num(r.lon),
  };
}

const catRef = (slug: unknown, name: unknown, nameRo: unknown, domainNumber: unknown): CategoryRef => ({
  slug: String(slug), name: String(name), nameRo: (nameRo as string) ?? null, domainNumber: Number(domainNumber),
});

function entitySummary(r: R): EntitySummary {
  return {
    slug: String(r.slug), name: String(r.name), entityType: r.entity_type as EntityType, shortDescription: (r.short_description as string) ?? null,
    reviewStatus: r.review_status as ReviewStatus, primaryCategory: catRef(r.cat_slug, r.cat_name, r.cat_name_ro, r.domain_number),
    domain: catRef(r.dom_slug, r.dom_name, r.dom_name_ro, r.domain_number), placeLabel: (r.place_label as string) ?? null,
    image: r.image_url ? { url: String(r.image_url), alt: String(r.image_alt ?? "") } : null,
  };
}

function mediaRow(m: R): MediaRow {
  return {
    id: String(m.id), areaId: (m.area_id as string) ?? null, entityId: (m.entity_id as string) ?? null, kind: m.kind as MediaRow["kind"],
    url: String(m.url), pageUrl: String(m.page_url), alt: String(m.alt), credit: String(m.credit), license: String(m.license),
    licenseUrl: String(m.license_url), year: num(m.year), aiGenerated: Boolean(m.ai_generated),
  };
}

function factRow(r: R): FactRow {
  return {
    id: String(r.id), areaId: (r.area_id as string) ?? null, entityId: (r.entity_id as string) ?? null, key: String(r.key),
    valueText: (r.value_text as string) ?? null, valueNum: num(r.value_num), unit: (r.unit as string) ?? null, asOf: isoDate(r.as_of),
    asOfLabel: (r.as_of_label as string) ?? null, sourceId: String(r.source_id), sourceRef: (r.source_ref as string) ?? null,
    reviewStatus: r.review_status as ReviewStatus, verifiedAt: iso(r.verified_at), note: (r.note as string) ?? null,
    scopeAreaId: (r.scope_area_id as string) ?? null,
  };
}

function sourceRow(r: R): SourceRow {
  return {
    id: String(r.id), kind: r.kind as SourceRow["kind"], title: String(r.title), publisher: String(r.publisher), url: String(r.url),
    datasetVersion: (r.dataset_version as string) ?? undefined, license: String(r.license), termsUrl: (r.terms_url as string) ?? undefined,
    redisplayPermitted: Boolean(r.redisplay_permitted), coverage: (r.coverage as string) ?? undefined, expectedFields: (r.expected_fields as string[]) ?? [],
    retrievalMethod: (r.retrieval_method as string) ?? undefined, refreshInterval: (r.refresh_interval as string) ?? undefined,
    limitations: (r.limitations as string) ?? undefined, retrievedAt: iso(r.retrieved_at) ?? undefined, checksumSha256: (r.checksum_sha256 as string) ?? undefined,
    entityId: (r.entity_id as string) ?? null,
  };
}

function lastCheck(r: R): SourceCheck | null {
  return r.lc_retrieved_at ? { retrievedAt: iso(r.lc_retrieved_at)!, httpStatus: num(r.lc_http_status), outcome: String(r.lc_outcome), pageTitle: (r.lc_page_title as string) ?? null } : null;
}

const SOURCE_WITH_CHECK = `s.*, lc.retrieved_at as lc_retrieved_at, lc.http_status as lc_http_status, lc.outcome as lc_outcome, lc.page_title as lc_page_title
  from sources s left join lateral (select * from source_records r where r.source_id = s.id order by retrieved_at desc limit 1) lc on true`;

/** Ranking identical to fixture mode's scoreText(); $1 = normalized query, $2 = tokens. */
const SCORE = (nameCol: string, docCol: string) => `case
  when ${nameCol} = $1 then 100
  when ${nameCol} like $1 || '%' then 70
  when (select bool_and(${nameCol} ~ ('(^| )' || t)) from unnest($2::text[]) t) then 50
  when (select bool_and(${docCol} like '%' || t || '%') from unnest($2::text[]) t) then 25
  else 0 end`;
const MATCH = (docCol: string) => `(select bool_and(${docCol} like '%' || t || '%') from unnest($2::text[]) t)`;

export class PostgresProvider implements DataProvider {
  readonly mode = "database" as const;
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, statement_timeout: 8_000, application_name: "america360-web" });
    this.pool.on("connect", (c) => void c.query("set search_path = a360, public"));
  }

  private async q<T extends R = R>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.pool.query<T>(sql, params)).rows;
  }

  async close() {
    await this.pool.end();
  }

  async getStats(): Promise<SiteStats> {
    const [counts] = await this.q(`select
      (select count(*) from entity_summaries)::int as entities,
      (select count(*) from entity_summaries where review_status = 'verified')::int as verified,
      (select count(*) from facts where review_status <> 'rejected')::int as facts,
      (select count(*) from sources)::int as sources,
      (select count(*) from categories)::int as categories,
      (select max(retrieved_at) from source_records) as built_at`);
    const types = await this.q("select area_type, count(*)::int as n from areas group by area_type");
    return {
      areasByType: Object.fromEntries(types.map((t) => [t.area_type, t.n])),
      entities: Number(counts!.entities), verifiedEntities: Number(counts!.verified), facts: Number(counts!.facts),
      sources: Number(counts!.sources), categories: Number(counts!.categories), builtAt: iso(counts!.built_at) ?? "",
    };
  }

  async getArea(slug: string): Promise<AreaDetail | null> {
    const [a] = await this.q(`select a.id, a.official_name, a.geoid, a.fips, a.ansi, a.usps, a.water_area_sqmi, a.boundary_note, a.review_status, a.source_ids, ${AREA_SUMMARY_COLS},
        coalesce((select array_agg(alias order by alias) from area_aliases where area_id = a.id), '{}') as aliases
      from areas a where a.slug = $1`, [slug]);
    if (!a) return null;
    const id = String(a.id);
    const [crumbs, facts, kids, rel, media, ent] = await Promise.all([
      this.q("select slug, name, area_type from area_ancestors($1)", [id]),
      this.q("select * from facts where area_id = $1 order by key, as_of", [id]),
      this.q("select area_type, count(*)::int as n from areas where parent_id = $1 group by area_type", [id]),
      this.q(`select r.relation_type, r.method, r.share, 'out' as direction, ${AREA_SUMMARY_COLS} from area_relations r join areas a on a.id = r.related_area_id where r.area_id = $1
              union all
              select r.relation_type, r.method, r.share, 'in' as direction, ${AREA_SUMMARY_COLS} from area_relations r join areas a on a.id = r.area_id where r.related_area_id = $1`, [id]),
      this.q("select * from media where area_id = $1", [id]),
      this.q("select count(distinct ea.entity_id)::int as n from entity_areas ea join entity_summaries e on e.id = ea.entity_id where ea.area_id in (select area_descendants($1)) and ea.review_status <> 'rejected'", [id]),
    ]);
    const factRows = facts.map(factRow);
    const sourceIds = [...new Set([...(a.source_ids as string[]), ...factRows.map((f) => f.sourceId)])];
    const sources = (await this.q("select * from sources where id = any($1::text[])", [sourceIds])).map(sourceRow);
    return {
      ...areaSummary(a), id, officialName: (a.official_name as string) ?? null, geoid: (a.geoid as string) ?? null, fips: (a.fips as string) ?? null,
      ansi: (a.ansi as string) ?? null, usps: (a.usps as string) ?? null, waterAreaSqMi: num(a.water_area_sqmi),
      boundaryNote: (a.boundary_note as string) ?? null, reviewStatus: a.review_status as ReviewStatus, aliases: a.aliases as string[],
      breadcrumbs: crumbs.map((c) => ({ slug: String(c.slug), name: String(c.name), areaType: c.area_type as AreaType })),
      facts: factRows, sources,
      media: media.map(mediaRow),
      childCounts: Object.fromEntries(kids.map((k) => [k.area_type, k.n])),
      related: rel.map((r) => ({ area: areaSummary(r), relationType: String(r.relation_type), method: (r.method as string) ?? null, share: num(r.share), direction: r.direction as "in" | "out" })),
      entityCount: Number(ent[0]?.n ?? 0),
    };
  }

  async listChildAreas(slug: string, opts: { areaType?: AreaType; q?: string; page?: number; pageSize?: number; deep?: boolean } = {}): Promise<Page<AreaSummary>> {
    const { page, pageSize, offset } = clampPage(opts.page, opts.pageSize, 500);
    const scope = opts.deep
      ? "a.id in (select area_descendants(root.id)) and a.id <> root.id"
      : "a.parent_id = root.id";
    const rows = await this.q(`select ${AREA_SUMMARY_COLS}, count(*) over() as total
      from areas a, (select id from areas where slug = $1) root
      where ${scope} and ($2::area_type is null or a.area_type = $2) and ($3::text is null or a.name_norm like '%' || $3 || '%')
      order by a.name limit $4 offset $5`, [slug, opts.areaType ?? null, opts.q ? normalize(opts.q) : null, pageSize, offset]);
    return { items: rows.map(areaSummary), total: Number(rows[0]?.total ?? 0), page, pageSize };
  }

  async getEntity(slug: string): Promise<EntityDetail | null> {
    const [e] = await this.q(`select s.*, e.status, e.official_url, e.sensitive_location, e.created_at, e.updated_at, e.verified_at, e.primary_source_id,
        e.wikidata_id, e.wikipedia_title, e.wikipedia_url, e.wikipedia_extract, e.wikipedia_retrieved_at,
        case when e.sensitive_location then null else st_y(e.location::geometry) end as lat,
        case when e.sensitive_location then null else st_x(e.location::geometry) end as lon,
        coalesce((select array_agg(alias order by alias) from entity_aliases where entity_id = e.id), '{}') as aliases
      from entity_summaries s join entities e on e.id = s.id where s.slug = $1`, [slug]);
    if (!e) return null;
    const id = String(e.id);
    const [cats, areas, rels, facts, ext, media, presence, issues] = await Promise.all([
      this.q(`select c.slug, c.name, c.name_ro, c.domain_number, ec.is_primary,
                (select json_agg(json_build_object('slug', pc.slug, 'name', pc.name, 'nameRo', pc.name_ro, 'domainNumber', pc.domain_number) order by ord)
                 from category_paths cp, unnest(cp.path) with ordinality as u(cid, ord) join categories pc on pc.id = u.cid where cp.id = c.id) as path
              from entity_categories ec join categories c on c.id = ec.category_id where ec.entity_id = $1 order by ec.is_primary desc, c.name`, [id]),
      this.q(`select a.slug, a.name, a.area_type, ea.relation_type, ea.review_status, ea.verified_at, ea.evidence, ea.note
              from entity_areas ea join areas a on a.id = ea.area_id where ea.entity_id = $1 order by area_rank(a.area_type), a.name`, [id]),
      this.q(`select s.*, r.relation_type, r.review_status as rel_status, r.verified_at as rel_verified_at, r.evidence as rel_evidence, r.source_id as rel_source_id,
                case when r.from_entity_id = $1 then 'out' else 'in' end as direction
              from entity_relations r join entity_summaries s on s.id = case when r.from_entity_id = $1 then r.to_entity_id else r.from_entity_id end
              where (r.from_entity_id = $1 or r.to_entity_id = $1) and r.review_status <> 'rejected'`, [id]),
      this.q("select * from facts where entity_id = $1 order by key", [id]),
      this.q("select provider, external_id from entity_external_ids where entity_id = $1 order by provider", [id]),
      this.q("select * from media where entity_id = $1 order by (kind = 'photo') desc, id", [id]),
      this.q("select a.slug, a.name, f.value_num, f.as_of from facts f join areas a on a.id = f.scope_area_id where f.entity_id = $1 and f.key = 'osm-location-count' order by f.value_num desc, a.slug collate \"C\"", [id]),
      this.q("select coalesce(sum(n), 0)::int as n from entity_open_issue_counts where entity_id = $1", [id]),
    ]);
    const factRows = facts.map(factRow);
    const sources = await this.q(`select ${SOURCE_WITH_CHECK}
      where s.id = $2 or s.entity_id = $1 or s.id = any($3::text[]) or s.id in (select source_id from entity_relations where from_entity_id = $1 and source_id is not null)`,
      [id, e.primary_source_id ?? null, factRows.map((f) => f.sourceId)]);
    let breadcrumbs: EntityDetail["breadcrumbs"] = [];
    if (e.place_slug) {
      const [pa] = await this.q("select id, slug, name, area_type from areas where slug = $1", [e.place_slug]);
      if (pa) {
        const anc = await this.q("select slug, name, area_type from area_ancestors($1)", [pa.id]);
        breadcrumbs = [...anc, pa].map((c) => ({ slug: String(c.slug), name: String(c.name), areaType: c.area_type as AreaType }));
      }
    }
    return {
      ...entitySummary(e), id, status: String(e.status), officialUrl: (e.official_url as string) ?? null, sensitiveLocation: Boolean(e.sensitive_location),
      aliases: e.aliases as string[], createdAt: iso(e.created_at)!, updatedAt: iso(e.updated_at)!, verifiedAt: iso(e.verified_at),
      categories: cats.map((c) => ({ ...catRef(c.slug, c.name, c.name_ro, c.domain_number), isPrimary: Boolean(c.is_primary), path: c.path as CategoryRef[] })),
      areas: areas.map((a) => ({ slug: String(a.slug), name: String(a.name), areaType: a.area_type as AreaType, relationType: String(a.relation_type), reviewStatus: a.review_status as ReviewStatus, verifiedAt: iso(a.verified_at), evidence: (a.evidence as string) ?? null, note: (a.note as string) ?? null })),
      breadcrumbs,
      relations: rels.map((r) => ({ entity: entitySummary(r), relationType: String(r.relation_type), direction: r.direction as "in" | "out", reviewStatus: r.rel_status as ReviewStatus, verifiedAt: iso(r.rel_verified_at), evidence: (r.rel_evidence as string) ?? null, sourceId: (r.rel_source_id as string) ?? null })),
      facts: factRows,
      sources: sources.map((s) => ({ ...sourceRow(s), lastCheck: lastCheck(s) })),
      externalIds: ext.map((x) => ({ provider: String(x.provider), externalId: String(x.external_id) })),
      openIssues: Number(issues[0]?.n ?? 0),
      lat: num(e.lat), lon: num(e.lon), wikidataId: (e.wikidata_id as string) ?? null,
      presence: presence.map((p) => ({ areaSlug: String(p.slug), areaName: String(p.name), count: Number(p.value_num), asOf: isoDate(p.as_of) })),
      wikipedia: e.wikipedia_extract ? { title: String(e.wikipedia_title), url: String(e.wikipedia_url), extract: String(e.wikipedia_extract), retrievedAt: iso(e.wikipedia_retrieved_at)! } : null,
      media: media.map(mediaRow),
    };
  }

  async listEntities(query: EntityQuery): Promise<Page<EntitySummary>> {
    const { page, pageSize, offset } = clampPage(query.page, query.pageSize);
    const qn = query.q ? normalize(query.q) : null;
    const qt = query.q ? tokens(query.q) : [];
    const rows = await this.q(`select s.*, ${qn ? SCORE("s.name_norm", "s.search_text") : "1"} as score, count(*) over() as total
      from entity_summaries s
      where ($3::text is null or exists (select 1 from entity_areas ea join areas root on root.slug = $3
                where ea.entity_id = s.id and ea.review_status <> 'rejected' and ea.area_id in (select area_descendants(root.id))))
        and ($4::text is null or exists (select 1 from entity_categories ec join categories root on root.slug = $4
                where ec.entity_id = s.id and ec.category_id in (select category_descendants(root.id))))
        and ($5::text is null or s.entity_type = $5)
        and ($6::review_status is null or s.review_status = $6)
        and ($1::text is null or ${MATCH("s.search_text")})
      order by score desc, s.name limit $7 offset $8`,
      [qn, qt, query.areaSlug ?? null, query.categorySlug ?? null, query.entityType ?? null, query.reviewStatus ?? null, pageSize, offset]);
    return { items: rows.map(entitySummary), total: Number(rows[0]?.total ?? 0), page, pageSize };
  }

  private async tree(scopeAreaSlug?: string): Promise<CategoryNode[]> {
    const cats = await this.q("select id, slug, name, name_ro, description, parent_id, domain_number, depth, sort_order from categories order by domain_number, depth, sort_order");
    const counts = await this.q(`select u.cid as id, count(distinct ec.entity_id)::int as n
      from entity_categories ec join entity_summaries s on s.id = ec.entity_id
      join category_paths cp on cp.id = ec.category_id, unnest(cp.path) as u(cid)
      where ($1::text is null or exists (select 1 from entity_areas ea join areas root on root.slug = $1
               where ea.entity_id = s.id and ea.review_status <> 'rejected' and ea.area_id in (select area_descendants(root.id))))
      group by u.cid`, [scopeAreaSlug ?? null]);
    const n = new Map(counts.map((c) => [String(c.id), Number(c.n)]));
    const byId = new Map(cats.map((c) => [String(c.id), c]));
    const kids = new Map<string, R[]>();
    for (const c of cats) if (c.parent_id) kids.set(String(c.parent_id), [...(kids.get(String(c.parent_id)) ?? []), c]);
    const make = (c: R): CategoryNode => ({
      ...catRef(c.slug, c.name, c.name_ro, c.domain_number), id: String(c.id), description: (c.description as string) ?? null, depth: Number(c.depth),
      parentSlug: c.parent_id ? String(byId.get(String(c.parent_id))!.slug) : null,
      children: (kids.get(String(c.id)) ?? []).sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map(make),
      entityCount: n.get(String(c.id)) ?? 0,
    });
    return cats.filter((c) => !c.parent_id).map(make);
  }

  async getCategoryTree(scopeAreaSlug?: string) {
    return this.tree(scopeAreaSlug);
  }

  async getCategory(slug: string) {
    const all = await this.tree();
    const walk = (nodes: CategoryNode[], path: CategoryRef[]): (CategoryNode & { path: CategoryRef[] }) | null => {
      for (const node of nodes) {
        const p = [...path, { slug: node.slug, name: node.name, nameRo: node.nameRo, domainNumber: node.domainNumber }];
        if (node.slug === slug) return { ...node, path: p };
        const f = walk(node.children, p);
        if (f) return f;
      }
      return null;
    };
    return walk(all, []);
  }

  async search(q: string, opts: { limit?: number; areaSlug?: string } = {}): Promise<SearchHit[]> {
    const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
    const qt = tokens(q);
    if (!qt.length) return [];
    const qn = normalize(q);
    const scope = opts.areaSlug ?? null;
    const [ents, areas, cats] = await Promise.all([
      this.q(`select s.*, ${SCORE("s.name_norm", "s.search_text")} + 5 as score from entity_summaries s
        where ${MATCH("s.search_text")} and ($3::text is null or exists (select 1 from entity_areas ea join areas root on root.slug = $3
          where ea.entity_id = s.id and ea.review_status <> 'rejected' and ea.area_id in (select area_descendants(root.id))))
        order by score desc, s.name limit $4`, [qn, qt, scope, limit]),
      this.q(`select a.slug, a.name, a.type_label, p.name as parent_name,
          ${SCORE("a.name_norm", "a.search_text")} + case when a.program_status = 'active' then 8 else 0 end + case when a.area_type = 'community' then -40 else 0 end as score
        from areas a left join areas p on p.id = a.parent_id
        where ${MATCH("a.search_text")} and ($3::text is null or a.id in (select area_descendants((select id from areas where slug = $3))))
        order by score desc, a.name limit $4`, [qn, qt, scope, limit]),
      this.q(`select c.slug, c.name, c.name_ro, c.description, c.parent_id, d.name as domain_name
        from categories c join category_paths cp on cp.id = c.id join categories d on d.id = cp.root_id`),
    ]);
    const hits: SearchHit[] = [
      ...ents.map((r): SearchHit => {
        const s = entitySummary(r);
        return { kind: "entity", slug: s.slug, name: s.name, subtitle: [s.primaryCategory.name, s.placeLabel].filter(Boolean).join(" · "), score: Number(r.score) };
      }),
      ...areas.map((r): SearchHit => ({ kind: "area", slug: String(r.slug), name: String(r.name), subtitle: [r.type_label, r.parent_name].filter(Boolean).join(" · "), score: Number(r.score) })),
      ...cats
        .map((c) => ({ c, s: scoreText(q, String(c.name), `${c.name} ${c.name_ro ?? ""} ${c.description ?? ""}`) }))
        .filter((x) => x.s > 0)
        .map(({ c, s }): SearchHit => ({ kind: "category", slug: String(c.slug), name: String(c.name), subtitle: c.parent_id ? String(c.domain_name) : "Domain", score: s })),
    ];
    return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "en")).slice(0, limit);
  }

  async getCoverage(areaSlug: string): Promise<CoverageReport | null> {
    const [area] = await this.q("select id, slug, name, area_type from areas where slug = $1", [areaSlug]);
    if (!area) return null;
    const id = String(area.id);
    const [domains, rows, universes, issues, built] = await Promise.all([
      this.q("select slug, name, name_ro, domain_number from categories where parent_id is null order by domain_number"),
      this.q(`select s.dom_slug, s.review_status, count(*)::int as n from entity_summaries s
        where exists (select 1 from entity_areas ea where ea.entity_id = s.id and ea.review_status <> 'rejected' and ea.area_id in (select area_descendants($1)))
        group by s.dom_slug, s.review_status`, [id]),
      // Descendants are computed once per universe (lateral), not once per candidate row.
      this.q(`select u.*, n.numerator
        from coverage_universes u
        cross join lateral (
          select count(*)::int as numerator
          from area_descendants(u.area_id) as d(id) join areas a on a.id = d.id
          where a.area_type = u.area_type and a.id <> u.area_id
            and (u.metric = 'area_count' or exists (select 1 from area_relations ar where ar.area_id = a.id and ar.relation_type = u.relation_type))
        ) n
        where u.area_id in (select area_descendants($1)) order by u.id`, [id]),
      this.q(`select i.kind, sum(i.n)::int as n from entity_open_issue_counts i join entity_summaries s on s.id = i.entity_id
        where exists (select 1 from entity_areas ea where ea.entity_id = i.entity_id and ea.review_status <> 'rejected' and ea.area_id in (select area_descendants($1)))
        group by i.kind order by n desc, i.kind`, [id]),
      this.q("select max(retrieved_at) as t from source_records"),
    ]);
    const cells = domains.map((d) => ({ domain: catRef(d.slug, d.name, d.name_ro, d.domain_number), total: 0, byStatus: emptyStatusCounts() }));
    const totals = { ...emptyStatusCounts(), all: 0 };
    for (const r of rows) {
      const cell = cells.find((c) => c.domain.slug === r.dom_slug)!;
      const st = r.review_status as ReviewStatus;
      cell.byStatus[st] += Number(r.n);
      cell.total += Number(r.n);
      totals[st] += Number(r.n);
      totals.all += Number(r.n);
    }
    return {
      area: { slug: String(area.slug), name: String(area.name), areaType: area.area_type as AreaType }, generatedAt: iso(built[0]?.t) ?? "",
      cells, totals,
      universes: universes.map((u) => ({ id: String(u.id), label: String(u.label), definition: String(u.definition), denominator: Number(u.denominator), numerator: Number(u.numerator), asOf: isoDate(u.as_of)!, sourceId: String(u.source_id) })),
      openIssues: issues.map((i) => ({ kind: String(i.kind), n: Number(i.n) })),
    };
  }

  async listSources() {
    const rows = await this.q(`select ${SOURCE_WITH_CHECK} order by s.id`);
    const usage = await this.q(`select source_id, sum(n)::int as n from (
        select source_id, count(*) as n from facts group by source_id
        union all select unnest(source_ids), count(*) from areas group by 1
        union all select primary_source_id, count(*) from entities where primary_source_id is not null group by 1
        union all select source_id, count(*) from entity_relations where source_id is not null group by 1
      ) u group by source_id`);
    const used = new Map(usage.map((u) => [String(u.source_id), Number(u.n)]));
    return rows.map((s) => ({ ...sourceRow(s), lastCheck: lastCheck(s), usage: used.get(String(s.id)) ?? 0 }));
  }

  async nearbyEntities(slug: string, opts: { limit?: number; radiusKm?: number } = {}): Promise<NearbyEntity[]> {
    const limit = Math.min(Math.max(opts.limit ?? 8, 1), 30);
    const radius = Math.min(opts.radiusKm ?? 3, 25);
    // Spherical distance (use_spheroid = false) to match the fixture haversine.
    const rows = await this.q(`select s.*, st_distance(o.location, e.location, false) / 1000 as km
      from entities e join entities o on o.id <> e.id and o.location is not null and not o.sensitive_location
      join entity_summaries s on s.id = o.id
      where e.slug = $1 and e.location is not null and not e.sensitive_location and st_dwithin(o.location, e.location, $2 * 1000, false)
      order by km, s.slug collate "C" limit $3`, [slug, radius, limit]);
    return rows.map((r) => ({ ...entitySummary(r), distanceKm: Math.round(Number(r.km) * 100) / 100 }));
  }

  async listBrandPresence(areaSlug: string, opts: { categorySlug?: string; limit?: number } = {}): Promise<BrandPresence[]> {
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
    const rows = await this.q(`select s.*, f.value_num as cnt, f.as_of
      from facts f join areas a on a.id = f.scope_area_id and a.slug = $1
      join entity_summaries s on s.id = f.entity_id
      where f.key = 'osm-location-count' and f.review_status <> 'rejected'
        and ($2::text is null or exists (select 1 from entity_categories ec join categories root on root.slug = $2
             where ec.entity_id = s.id and ec.category_id in (select category_descendants(root.id))))
      order by cnt desc, s.name limit $3`, [areaSlug, opts.categorySlug ?? null, limit]);
    return rows.map((r) => ({ entity: entitySummary(r), count: Number(r.cnt), asOf: isoDate(r.as_of) }));
  }

  async resolveRedirect(kind: "entity" | "area" | "category", slug: string): Promise<string | null> {
    const table = kind === "entity" ? "entities" : kind === "area" ? "areas" : "categories";
    const [r] = await this.q(`select t.slug from slug_redirects r join ${table} t on t.id = r.target_id where r.kind = $1 and r.old_slug = $2`, [kind, slug]);
    return r ? String(r.slug) : null;
  }
}
