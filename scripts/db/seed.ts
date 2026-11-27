/**
 * Idempotent seeder: builds the normalized Dataset from seed/ (exactly what
 * fixture mode serves) and upserts it into PostgreSQL in ONE transaction,
 * tracked by an import_runs row. Rows are only rewritten when they changed,
 * so a second run reports zero changes. Rows that disappeared from the seed
 * snapshot are pruned; open review issues that no longer apply are resolved.
 *
 * Usage: npm run db:seed [-- --dry-run]
 */
import path from "node:path";
import pg from "pg";
import { buildDataset } from "../../src/lib/data/build";
import { DatasetIndex, areaSearchText, entitySearchText } from "../../src/lib/data/derive";
import { loadGeometry, loadPlaceGeometry, loadSeedInputs } from "../../src/lib/data/inputs";
import { normalize } from "../../src/lib/text";
import { sha256 } from "../ingest/lib";
import { ownerUrl, withClient } from "./common";

type Col = [name: string, sqlType: string];
type Row = Record<string, unknown>;

export const SCHEMA_VERSION = "0006";

async function upsert(c: pg.Client, table: string, cols: Col[], key: string[], rows: Row[]): Promise<number> {
  if (!rows.length) return 0;
  const names = cols.map((x) => x[0]);
  const nonKey = names.filter((n) => !key.includes(n));
  const action = nonKey.length
    ? `update set ${nonKey.map((n) => `${n} = excluded.${n}`).join(", ")} where (${nonKey.map((n) => `${table}.${n}`).join(", ")}) is distinct from (${nonKey.map((n) => `excluded.${n}`).join(", ")})`
    : "nothing";
  const sql = `insert into ${table} (${names.join(", ")})
    select ${names.join(", ")} from jsonb_to_recordset($1::jsonb) as x(${cols.map(([n, t]) => `${n} ${t}`).join(", ")})
    on conflict (${key.join(", ")}) do ${action}`;
  let changed = 0;
  for (let i = 0; i < rows.length; i += 2000) changed += (await c.query(sql, [JSON.stringify(rows.slice(i, i + 2000))])).rowCount ?? 0;
  return changed;
}

/** Delete rows of a snapshot-managed table whose key is no longer in the seed. */
async function prune(c: pg.Client, table: string, keyExpr: string, keys: string[]): Promise<number> {
  return (await c.query(`delete from ${table} where ${keyExpr} <> all($1::text[])`, [keys])).rowCount ?? 0;
}

export async function seed(url = ownerUrl(), opts: { dryRun?: boolean; log?: (...a: unknown[]) => void } = {}) {
  const log = opts.log ?? console.log;
  const inputs = loadSeedInputs();
  const ds = buildDataset(inputs);
  const idx = new DatasetIndex(ds);
  const geometry = loadGeometry();
  const inputChecksum = sha256(JSON.stringify(ds));

  return withClient(url, async (c) => {
    await c.query("set search_path = a360, public");
    const run = (await c.query<{ id: string }>(
      "insert into import_runs (adapter, source_ids, dry_run, schema_version, input_checksum) values ($1, $2, $3, $4, $5) returning id",
      ["seed:dataset", ds.sources.filter((s) => s.kind === "dataset").map((s) => s.id), !!opts.dryRun, SCHEMA_VERSION, inputChecksum],
    )).rows[0]!.id;
    const counts: Record<string, number> = {};
    try {
      await c.query("begin");
      await c.query("set constraints all deferred");

      counts.sources = await upsert(c, "sources", [
        ["id", "text"], ["kind", "source_kind"], ["title", "text"], ["publisher", "text"], ["url", "text"], ["dataset_version", "text"],
        ["license", "text"], ["terms_url", "text"], ["redisplay_permitted", "boolean"], ["coverage", "text"], ["expected_fields", "text[]"],
        ["retrieval_method", "text"], ["refresh_interval", "text"], ["limitations", "text"], ["retrieved_at", "timestamptz"],
        ["checksum_sha256", "text"], ["entity_id", "uuid"],
      ], ["id"], ds.sources.map((s) => ({
        id: s.id, kind: s.kind, title: s.title, publisher: s.publisher, url: s.url, dataset_version: s.datasetVersion ?? null, license: s.license,
        terms_url: s.termsUrl ?? null, redisplay_permitted: s.redisplayPermitted, coverage: s.coverage ?? null, expected_fields: s.expectedFields,
        retrieval_method: s.retrievalMethod ?? null, refresh_interval: s.refreshInterval ?? null, limitations: s.limitations ?? null,
        retrieved_at: s.retrievedAt ?? null, checksum_sha256: s.checksumSha256 ?? null, entity_id: s.entityId,
      })));

      // Parents before children.
      const depth = (a: (typeof ds.areas)[number]) => idx.areaAncestors(a).length;
      const areas = [...ds.areas].sort((x, y) => depth(x) - depth(y));
      counts.areas = await upsert(c, "areas", [
        ["id", "uuid"], ["slug", "text"], ["name", "text"], ["official_name", "text"], ["area_type", "area_type"], ["type_label", "text"],
        ["parent_id", "uuid"], ["geoid", "text"], ["fips", "text"], ["ansi", "text"], ["usps", "text"], ["funcstat", "text"],
        ["land_area_sqmi", "numeric"], ["water_area_sqmi", "numeric"], ["summary", "text"], ["boundary_note", "text"],
        ["program_status", "text"], ["review_status", "review_status"], ["source_ids", "text[]"], ["name_norm", "text"], ["search_text", "text"],
      ], ["id"], areas.map((a) => ({
        id: a.id, slug: a.slug, name: a.name, official_name: a.officialName, area_type: a.areaType, type_label: a.typeLabel, parent_id: a.parentId,
        geoid: a.geoid, fips: a.fips, ansi: a.ansi, usps: a.usps, funcstat: a.funcstat, land_area_sqmi: a.landAreaSqMi, water_area_sqmi: a.waterAreaSqMi,
        summary: a.summary, boundary_note: a.boundaryNote, program_status: a.programStatus, review_status: a.reviewStatus, source_ids: a.sourceIds,
        name_norm: normalize([a.name, ...a.aliases].join(" ")), search_text: normalize(areaSearchText(idx, a)),
      })));
      counts.areaPoints = (await c.query(
        `update areas a set internal_point = st_setsrid(st_makepoint(x.lon, x.lat), 4326)::geography
         from jsonb_to_recordset($1::jsonb) as x(id uuid, lat float8, lon float8)
         where a.id = x.id and (a.internal_point is null or not st_equals(a.internal_point::geometry, st_setsrid(st_makepoint(x.lon, x.lat), 4326)))`,
        [JSON.stringify(ds.areas.filter((a) => a.lat !== null).map((a) => ({ id: a.id, lat: a.lat, lon: a.lon })))],
      )).rowCount ?? 0;
      const placeGeo = loadPlaceGeometry();
      const geoRows = [
        ...[...geometry.states.features, ...geometry.floridaCounties.features].map((f) => ({ slug: f.properties.slug, geojson: JSON.stringify(f.geometry), source: geometry.sourceId })),
        ...[...placeGeo.values()].map((f) => ({ slug: f.properties.slug, geojson: JSON.stringify(f.geometry), source: "census-cb-2025-places-counties" })),
      ].filter((r) => ds.areas.some((a) => a.slug === r.slug));
      counts.areaGeometries = 0;
      for (let i = 0; i < geoRows.length; i += 300) {
        counts.areaGeometries += (await c.query(
          `update areas a set geom = g.geom, geom_source_id = g.source
           from (select x.slug, x.source, st_multi(st_collectionextract(st_makevalid(st_setsrid(st_geomfromgeojson(x.geojson), 4326)), 3)) as geom
                 from jsonb_to_recordset($1::jsonb) as x(slug text, geojson text, source text)) g
           where a.slug = g.slug and (a.geom is null or not st_equals(a.geom, g.geom))`,
          [JSON.stringify(geoRows.slice(i, i + 300))],
        )).rowCount ?? 0;
      }
      await c.query("delete from area_aliases where area_id = any($1::uuid[])", [ds.areas.map((a) => a.id)]);
      await upsert(c, "area_aliases", [["area_id", "uuid"], ["alias", "text"]], ["area_id", "alias"], ds.areas.flatMap((a) => a.aliases.map((alias) => ({ area_id: a.id, alias }))));
      counts.areaRelations = await upsert(c, "area_relations", [
        ["id", "uuid"], ["area_id", "uuid"], ["related_area_id", "uuid"], ["relation_type", "text"], ["source_id", "text"], ["method", "text"], ["share", "numeric"], ["review_status", "review_status"],
      ], ["id"], ds.areaRelations.map((r) => ({ id: r.id, area_id: r.areaId, related_area_id: r.relatedAreaId, relation_type: r.relationType, source_id: r.sourceId, method: r.method, share: r.share, review_status: r.reviewStatus })));

      const cats = [...ds.categories].sort((a, b) => a.depth - b.depth);
      counts.categories = await upsert(c, "categories", [
        ["id", "uuid"], ["slug", "text"], ["name", "text"], ["name_ro", "text"], ["description", "text"], ["parent_id", "uuid"], ["domain_number", "int"], ["depth", "int"], ["sort_order", "int"],
      ], ["id"], cats.map((k) => ({ id: k.id, slug: k.slug, name: k.name, name_ro: k.nameRo, description: k.description, parent_id: k.parentId, domain_number: k.domainNumber, depth: k.depth, sort_order: k.sortOrder })));

      counts.entities = await upsert(c, "entities", [
        ["id", "uuid"], ["slug", "text"], ["name", "text"], ["entity_type", "text"], ["status", "entity_status"], ["short_description", "text"],
        ["official_url", "text"], ["sensitive_location", "boolean"], ["visibility", "visibility"], ["review_status", "review_status"],
        ["primary_source_id", "text"], ["created_at", "timestamptz"], ["updated_at", "timestamptz"], ["verified_at", "timestamptz"],
        ["name_norm", "text"], ["search_text", "text"],
      ], ["id"], ds.entities.map((e) => ({
        id: e.id, slug: e.slug, name: e.name, entity_type: e.entityType, status: e.status, short_description: e.shortDescription, official_url: e.officialUrl,
        sensitive_location: e.sensitiveLocation, visibility: e.visibility, review_status: e.reviewStatus, primary_source_id: e.primarySourceId,
        created_at: e.createdAt, updated_at: e.updatedAt, verified_at: e.verifiedAt,
        name_norm: normalize([e.name, ...e.aliases].join(" ")), search_text: normalize(entitySearchText(idx, e)),
      })));
      const entityIds = ds.entities.map((e) => e.id);
      for (const t of ["entity_aliases", "entity_categories", "entity_areas", "entity_external_ids"]) await c.query(`delete from ${t} where entity_id = any($1::uuid[])`, [entityIds]);
      await upsert(c, "entity_aliases", [["entity_id", "uuid"], ["alias", "text"]], ["entity_id", "alias"], ds.entities.flatMap((e) => e.aliases.map((alias) => ({ entity_id: e.id, alias }))));
      await upsert(c, "entity_categories", [["entity_id", "uuid"], ["category_id", "uuid"], ["is_primary", "boolean"]], ["entity_id", "category_id"],
        ds.entityCategories.map((x) => ({ entity_id: x.entityId, category_id: x.categoryId, is_primary: x.isPrimary })));
      await upsert(c, "entity_areas", [
        ["entity_id", "uuid"], ["area_id", "uuid"], ["relation_type", "text"], ["review_status", "review_status"], ["evidence", "text"], ["verified_at", "timestamptz"], ["note", "text"],
      ], ["entity_id", "area_id", "relation_type"], ds.entityAreas.map((x) => ({ entity_id: x.entityId, area_id: x.areaId, relation_type: x.relationType, review_status: x.reviewStatus, evidence: x.evidence, verified_at: x.verifiedAt, note: x.note })));
      await upsert(c, "entity_external_ids", [["entity_id", "uuid"], ["provider", "text"], ["external_id", "text"]], ["provider", "external_id"],
        ds.externalIds.map((x) => ({ entity_id: x.entityId, provider: x.provider, external_id: x.externalId })));
      counts.entityRelations = await upsert(c, "entity_relations", [
        ["id", "uuid"], ["from_entity_id", "uuid"], ["to_entity_id", "uuid"], ["relation_type", "text"], ["source_id", "text"], ["evidence", "text"], ["review_status", "review_status"], ["verified_at", "timestamptz"],
      ], ["id"], ds.entityRelations.map((r) => ({ id: r.id, from_entity_id: r.fromEntityId, to_entity_id: r.toEntityId, relation_type: r.relationType, source_id: r.sourceId, evidence: r.evidence, review_status: r.reviewStatus, verified_at: r.verifiedAt })));

      counts.sourceRecords = await upsert(c, "source_records", [
        ["id", "uuid"], ["source_id", "text"], ["external_ref", "text"], ["retrieved_at", "timestamptz"], ["http_status", "int"], ["outcome", "text"], ["page_title", "text"], ["final_url", "text"], ["checksum_sha256", "text"],
      ], ["id"], ds.sourceRecords.map((r) => ({ id: r.id, source_id: r.sourceId, external_ref: r.externalRef, retrieved_at: r.retrievedAt, http_status: r.httpStatus, outcome: r.outcome, page_title: r.pageTitle, final_url: r.finalUrl, checksum_sha256: r.checksumSha256 })));

      counts.facts = await upsert(c, "facts", [
        ["id", "uuid"], ["area_id", "uuid"], ["entity_id", "uuid"], ["key", "text"], ["value_text", "text"], ["value_num", "numeric"], ["unit", "text"], ["as_of", "date"],
        ["as_of_label", "text"], ["source_id", "text"], ["source_ref", "text"], ["review_status", "review_status"], ["verified_at", "timestamptz"], ["note", "text"],
      ], ["id"], ds.facts.map((f) => ({ id: f.id, area_id: f.areaId, entity_id: f.entityId, key: f.key, value_text: f.valueText, value_num: f.valueNum, unit: f.unit, as_of: f.asOf, as_of_label: f.asOfLabel, source_id: f.sourceId, source_ref: f.sourceRef, review_status: f.reviewStatus, verified_at: f.verifiedAt, note: f.note })));

      counts.media = await upsert(c, "media", [
        ["id", "uuid"], ["area_id", "uuid"], ["entity_id", "uuid"], ["kind", "text"], ["url", "text"], ["page_url", "text"], ["alt", "text"], ["credit", "text"], ["license", "text"], ["license_url", "text"], ["year", "int"], ["ai_generated", "boolean"],
      ], ["id"], ds.media.map((m) => ({ id: m.id, area_id: m.areaId, entity_id: m.entityId, kind: m.kind, url: m.url, page_url: m.pageUrl, alt: m.alt, credit: m.credit, license: m.license, license_url: m.licenseUrl, year: m.year, ai_generated: m.aiGenerated })));

      counts.reviewIssues = await upsert(c, "review_issues", [
        ["id", "uuid"], ["kind", "text"], ["entity_id", "uuid"], ["area_id", "uuid"], ["source_id", "text"], ["detail", "text"], ["created_at", "timestamptz"],
      ], ["id"], ds.reviewIssues.map((i) => ({ id: i.id, kind: i.kind, entity_id: i.entityId, area_id: i.areaId, source_id: i.sourceId, detail: i.detail, created_at: i.createdAt })));
      counts.reviewIssuesResolved = (await c.query(
        "update review_issues set status = 'resolved', resolved_at = now(), resolved_by = 'seed' where status = 'open' and id <> all($1::uuid[])",
        [ds.reviewIssues.map((i) => i.id)],
      )).rowCount ?? 0;

      counts.coverageUniverses = await upsert(c, "coverage_universes", [
        ["id", "text"], ["area_id", "uuid"], ["label", "text"], ["definition", "text"], ["area_type", "area_type"], ["category_id", "uuid"], ["denominator", "int"], ["as_of", "date"], ["source_id", "text"], ["metric", "text"], ["relation_type", "text"],
      ], ["id"], ds.coverageUniverses.map((u) => ({ id: u.id, area_id: u.areaId, label: u.label, definition: u.definition, area_type: u.areaType, category_id: u.categoryId, denominator: u.denominator, as_of: u.asOf, source_id: u.sourceId, metric: u.metric, relation_type: u.relationType })));

      // Snapshot semantics: remove rows no longer present in the seed.
      counts.pruned =
        (await prune(c, "facts", "id::text", ds.facts.map((f) => f.id))) +
        (await prune(c, "media", "id::text", ds.media.map((m) => m.id))) +
        (await prune(c, "entity_relations", "id::text", ds.entityRelations.map((r) => r.id))) +
        (await prune(c, "area_relations", "id::text", ds.areaRelations.map((r) => r.id))) +
        (await prune(c, "coverage_universes", "id", ds.coverageUniverses.map((u) => u.id))) +
        (await prune(c, "entities", "id::text", entityIds));

      if (opts.dryRun) {
        await c.query("rollback");
        await c.query("update import_runs set status = 'rolled_back', finished_at = now(), counts = $2 where id = $1", [run, counts]);
        log("dry run — rolled back", counts);
      } else {
        await c.query("commit");
        // Fresh planner statistics after a bulk load; without them recursive scope queries can pick slow plans.
        await c.query("analyze");
        await c.query("update import_runs set status = 'succeeded', finished_at = now(), counts = $2 where id = $1", [run, counts]);
        log("seed committed", counts);
      }
      return { runId: run, counts };
    } catch (e) {
      await c.query("rollback");
      await c.query("update import_runs set status = 'failed', finished_at = now(), error = $2 where id = $1", [run, (e as Error).message]);
      throw e;
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  seed(undefined, { dryRun: process.argv.includes("--dry-run") }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
