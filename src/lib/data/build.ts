import { stableId } from "@/lib/ids";
import type { CategoryInput, EntityInput, LinkCheck, ReviewStatus, Source } from "@/lib/domain/schemas";
import type {
  AreaRow,
  CategoryRow,
  Dataset,
  EntityAreaRow,
  EntityRow,
  EntityRelationRow,
  FactRow,
  ReviewIssueRow,
  SourceRecordRow,
  SourceRow,
} from "./dataset";
import type { SeedInputs } from "./inputs";

export const siteSourceId = (entitySlug: string) => `site-${entitySlug}`;
/** Source id for a county's official website (checked by ingest:links). */
export const countyWebsiteSourceId = (countySlug: string) => `site-${countySlug}`;
/** County short name used as link-check evidence: "st-johns-county-fl" -> "St. Johns", "miami-dade-county-fl" -> "Miami-Dade". */
export function countyShortName(countySlug: string): string {
  return countySlug
    .replace(/-county-fl$/, "")
    .split("-")
    .map((w) => (w === "st" ? "St." : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/^Desoto$/, "DeSoto")
    .replace(/^Miami Dade$/, "Miami-Dade");
}

export function primarySourceId(e: EntityInput): string | null {
  return e.officialUrl ? siteSourceId(e.slug) : (e.sourceIds[0] ?? null);
}

export function websiteSource(e: EntityInput): Source | null {
  if (!e.officialUrl) return null;
  return {
    id: siteSourceId(e.slug),
    kind: "official_website",
    title: `${e.name} — official website`,
    publisher: e.name,
    url: e.officialUrl,
    license: "Cited as a reference link; page content is not redisplayed",
    redisplayPermitted: false,
    expectedFields: [],
    retrievalMethod: "Automated link check (single GET, robots.txt respected)",
    refreshInterval: "Quarterly link check",
  };
}

/** Every (source, evidence text) pair the link checker must look for. */
export function collectEvidenceRequests(inputs: Pick<SeedInputs, "curated" | "curatedSources">): Map<string, { url: string; evidence: Set<string> }> {
  const out = new Map<string, { url: string; evidence: Set<string> }>();
  const ensure = (id: string, url: string) => {
    if (!out.has(id)) out.set(id, { url, evidence: new Set() });
    return out.get(id)!;
  };
  for (const s of inputs.curatedSources) ensure(s.id, s.url);
  const urlOf = new Map<string, string>(inputs.curatedSources.map((s) => [s.id, s.url]));
  for (const e of inputs.curated.entities) {
    const site = websiteSource(e);
    if (site) urlOf.set(site.id, site.url);
  }
  for (const e of inputs.curated.entities) {
    const primary = primarySourceId(e);
    if (primary && urlOf.has(primary)) {
      const req = ensure(primary, urlOf.get(primary)!);
      for (const a of e.areas) if (a.evidence) req.evidence.add(a.evidence);
      for (const c of e.claims) if (!c.sourceId) req.evidence.add(c.evidence);
    }
    for (const c of e.claims) if (c.sourceId && urlOf.has(c.sourceId)) ensure(c.sourceId, urlOf.get(c.sourceId)!).evidence.add(c.evidence);
    for (const r of e.relations) {
      const sid = r.sourceId ?? primary;
      if (sid && r.claimEvidence && urlOf.has(sid)) ensure(sid, urlOf.get(sid)!).evidence.add(r.claimEvidence);
    }
  }
  return out;
}

type Verdict = { status: ReviewStatus; verifiedAt: string | null; issue: ReviewIssueRow["kind"] | null; detail: string };

function judge(check: LinkCheck | undefined, evidence: string | undefined, fallback: ReviewStatus): Verdict {
  if (!evidence) return { status: fallback, verifiedAt: null, issue: null, detail: "" };
  if (!check) return { status: "unreviewed", verifiedAt: null, issue: "claim_unverified", detail: "Source not yet checked (run npm run ingest:links)." };
  if (check.outcome === "blocked") return { status: "unreviewed", verifiedAt: null, issue: "source_blocked", detail: `Source refused automated check (HTTP ${check.httpStatus ?? "n/a"}); needs manual review.` };
  if (check.outcome === "not_found") return { status: "stale", verifiedAt: null, issue: "source_unreachable", detail: `Source page not found (HTTP ${check.httpStatus}); link is outdated.` };
  if (check.outcome !== "ok") return { status: "unreviewed", verifiedAt: null, issue: "source_unreachable", detail: `Source check outcome: ${check.outcome} (HTTP ${check.httpStatus ?? "n/a"}); needs another check or manual review.` };
  const hit = check.evidence.find((x) => x.text === evidence);
  if (hit?.found) return { status: "verified", verifiedAt: check.checkedAt, issue: null, detail: "" };
  return { status: "unreviewed", verifiedAt: null, issue: "claim_unverified", detail: `Evidence text "${evidence}" not found in source page on ${check.checkedAt.slice(0, 10)}.` };
}

function flattenCategories(domains: CategoryInput[]): CategoryRow[] {
  const rows: CategoryRow[] = [];
  const walk = (node: CategoryInput, parentId: string | null, domainNumber: number, depth: number, sortOrder: number) => {
    const id = stableId("category", node.slug);
    rows.push({ id, slug: node.slug, name: node.name, nameRo: node.nameRo ?? null, description: node.description ?? null, parentId, domainNumber, depth, sortOrder });
    (node.children ?? []).forEach((c, i) => walk(c, id, domainNumber, depth + 1, i));
  };
  domains.forEach((d, i) => walk(d, null, i + 1, 0, i));
  return rows;
}

export class DatasetError extends Error {}

export function buildDataset(inputs: SeedInputs): Dataset {
  const { census, taxonomy, curated, curatedSources, media, linkChecks } = inputs;
  const createdAt = `${curated.curatedAt}T00:00:00.000Z`;
  const checks = new Map((linkChecks?.checks ?? []).map((c) => [c.sourceId, c]));

  // ---- sources
  const sources: SourceRow[] = [];
  const sourceIds = new Set<string>();
  const addSource = (s: Source, entityId: string | null) => {
    if (sourceIds.has(s.id)) throw new DatasetError(`duplicate source id ${s.id}`);
    sourceIds.add(s.id);
    sources.push({ ...s, entityId });
  };
  census.sources.forEach((s) => addSource(s, null));
  curatedSources.forEach((s) => addSource(s, null));
  for (const e of curated.entities) {
    const site = websiteSource(e);
    if (site) addSource(site, stableId("entity", e.slug));
  }

  const sourceRecords: SourceRecordRow[] = [...checks.values()]
    .filter((c) => sourceIds.has(c.sourceId))
    .map((c) => ({
      id: stableId("fact", `linkcheck:${c.sourceId}:${c.checkedAt}`),
      sourceId: c.sourceId,
      importRunId: null,
      externalRef: c.url,
      retrievedAt: c.checkedAt,
      httpStatus: c.httpStatus,
      outcome: c.outcome,
      pageTitle: c.pageTitle,
      finalUrl: c.finalUrl,
      checksumSha256: c.bodySha256,
    }));

  // ---- areas (Census registry + curated neighborhoods + Phase 2 geography)
  const geo = inputs.geography;
  for (const s of geo?.sources ?? []) addSource(s, null);
  const overrides = new Map((geo?.parentOverrides ?? []).map((o) => [o.slug, o.parentSlug]));
  const enrich = new Map<string, NonNullable<typeof geo>["areaEnrichments"][number]>();
  for (const e of geo?.areaEnrichments ?? []) if (!enrich.has(e.slug)) enrich.set(e.slug, e);
  const allAreas = [...census.areas, ...curated.neighborhoods, ...(geo?.areas ?? [])].map((a) => {
    const parentSlug = overrides.get(a.slug) ?? a.parentSlug;
    const en = enrich.get(a.slug);
    if (!en) return { ...a, parentSlug };
    return {
      ...a, parentSlug, internalPoint: a.internalPoint ?? en.internalPoint,
      codes: { ...a.codes, ansi: a.codes.ansi ?? en.ansi },
      sourceIds: a.sourceIds.includes(en.sourceId) ? a.sourceIds : [...a.sourceIds, en.sourceId],
    };
  });
  const areaIdBySlug = new Map<string, string>();
  for (const a of allAreas) {
    if (areaIdBySlug.has(a.slug)) throw new DatasetError(`duplicate area slug ${a.slug}`);
    areaIdBySlug.set(a.slug, stableId("area", a.slug));
  }
  const areaId = (slug: string, ctx: string) => {
    const id = areaIdBySlug.get(slug);
    if (!id) throw new DatasetError(`${ctx}: unknown area ${slug}`);
    return id;
  };
  const areas: AreaRow[] = allAreas.map((a) => {
    for (const s of a.sourceIds) if (!sourceIds.has(s)) throw new DatasetError(`area ${a.slug}: unknown source ${s}`);
    return {
      id: areaIdBySlug.get(a.slug)!,
      slug: a.slug,
      name: a.name,
      officialName: a.officialName ?? null,
      areaType: a.areaType,
      typeLabel: a.typeLabel ?? null,
      parentId: a.parentSlug ? areaId(a.parentSlug, `area ${a.slug}`) : null,
      geoid: a.codes.geoid ?? null,
      fips: a.codes.fips ?? null,
      ansi: a.codes.ansi ?? null,
      usps: a.codes.usps ?? null,
      funcstat: a.codes.funcstat ?? null,
      landAreaSqMi: a.landAreaSqMi ?? null,
      waterAreaSqMi: a.waterAreaSqMi ?? null,
      lat: a.internalPoint?.lat ?? null,
      lon: a.internalPoint?.lon ?? null,
      summary: a.summary ?? null,
      boundaryNote: a.boundaryNote ?? null,
      programStatus: a.programStatus,
      reviewStatus: a.reviewStatus,
      sourceIds: a.sourceIds,
      aliases: a.aliases,
    };
  });
  // Geometric intersections (Phase 2) replace the bundle-1 approximations for the same places.
  const geometric = new Set(geo?.placesWithGeometry ?? []);
  const censusRelations = census.areaRelations.filter(
    (r) => !(geometric.has(r.areaSlug) && (r.relationType === "intersects" || r.relationType === "contains_internal_point_of")),
  );
  const areaRelations = [...censusRelations, ...(geo?.areaRelations ?? [])].map((r) => ({
    id: stableId("relation", `area:${r.areaSlug}:${r.relationType}:${r.relatedSlug}`),
    areaId: areaId(r.areaSlug, "areaRelation"),
    relatedAreaId: areaId(r.relatedSlug, "areaRelation"),
    relationType: r.relationType,
    sourceId: r.sourceId,
    method: r.method ?? null,
    share: r.share ?? null,
    reviewStatus: r.reviewStatus,
  }));
  const relKeys = new Set<string>();
  for (const r of areaRelations) {
    if (relKeys.has(r.id)) throw new DatasetError(`duplicate area relation ${r.id}`);
    relKeys.add(r.id);
  }

  // ---- categories
  const categories = flattenCategories(taxonomy.domains);
  const categoryIdBySlug = new Map<string, string>();
  for (const c of categories) {
    if (categoryIdBySlug.has(c.slug)) throw new DatasetError(`duplicate category slug ${c.slug}`);
    categoryIdBySlug.set(c.slug, c.id);
  }

  // ---- entities
  const entityIdBySlug = new Map<string, string>();
  for (const e of curated.entities) {
    if (entityIdBySlug.has(e.slug) || areaIdBySlug.has(e.slug)) throw new DatasetError(`duplicate entity slug ${e.slug}`);
    entityIdBySlug.set(e.slug, stableId("entity", e.slug));
  }

  const facts: FactRow[] = [...census.facts, ...(geo?.facts ?? [])].map((f) => ({
    id: stableId("fact", `${f.subjectKind}:${f.subjectSlug}:${f.key}:${f.sourceId}:${f.asOf ?? f.asOfLabel ?? ""}`),
    areaId: f.subjectKind === "area" ? areaId(f.subjectSlug, `fact ${f.key}`) : null,
    entityId: f.subjectKind === "entity" ? (entityIdBySlug.get(f.subjectSlug) ?? null) : null,
    key: f.key,
    valueText: typeof f.value === "string" ? f.value : null,
    valueNum: typeof f.value === "number" ? f.value : null,
    unit: f.unit ?? null,
    asOf: f.asOf ?? null,
    asOfLabel: f.asOfLabel ?? null,
    sourceId: f.sourceId,
    sourceRef: f.sourceRef ?? null,
    reviewStatus: f.reviewStatus,
    verifiedAt: null,
    note: f.note ?? null,
  }));

  const entityAreas: EntityAreaRow[] = [];
  const entityRelations: EntityRelationRow[] = [];
  const reviewIssues: ReviewIssueRow[] = [];
  const issue = (kind: ReviewIssueRow["kind"], entityId: string, sourceId: string | null, detail: string) =>
    reviewIssues.push({ id: stableId("fact", `issue:${kind}:${entityId}:${sourceId}:${detail}`), kind, entityId, areaId: null, sourceId, detail, status: "open", createdAt });

  const entities = curated.entities.map((e) => {
    const id = entityIdBySlug.get(e.slug)!;
    const primary = primarySourceId(e);
    for (const s of e.sourceIds) if (!sourceIds.has(s)) throw new DatasetError(`entity ${e.slug}: unknown source ${s}`);
    const primaryCheck = primary ? checks.get(primary) : undefined;
    let anyVerified = false;
    let latestVerified: string | null = null;
    const markVerified = (v: Verdict) => {
      if (v.status === "verified") {
        anyVerified = true;
        latestVerified = v.verifiedAt;
      }
    };

    const seenAreas = new Set<string>();
    for (const a of e.areas) {
      const key = `${a.slug}:${a.relation}`;
      if (seenAreas.has(key)) throw new DatasetError(`entity ${e.slug}: duplicate area link ${key}`);
      seenAreas.add(key);
      const v = judge(primaryCheck, a.evidence, a.reviewStatus);
      markVerified(v);
      if (v.issue) issue(v.issue === "claim_unverified" ? "location_unverified" : v.issue, id, primary, `${a.relation} ${a.slug}: ${v.detail}`);
      entityAreas.push({ entityId: id, areaId: areaId(a.slug, `entity ${e.slug}`), relationType: a.relation, reviewStatus: v.status, evidence: a.evidence ?? null, verifiedAt: v.verifiedAt, note: a.note ?? null });
    }

    for (const c of e.claims) {
      const sid = c.sourceId ?? primary;
      if (!sid) throw new DatasetError(`entity ${e.slug}: claim ${c.key} has no source`);
      const v = judge(checks.get(sid), c.evidence, "unreviewed");
      markVerified(v);
      if (v.status === "verified") {
        facts.push({
          id: stableId("fact", `entity:${e.slug}:${c.key}:${sid}`),
          areaId: null, entityId: id, key: c.key,
          valueText: typeof c.value === "string" ? c.value : null,
          valueNum: typeof c.value === "number" ? c.value : null,
          unit: c.unit ?? null, asOf: null, asOfLabel: null, sourceId: sid,
          sourceRef: `evidence: "${c.evidence}"`, reviewStatus: "verified", verifiedAt: v.verifiedAt, note: null,
        });
      } else {
        issue(v.issue ?? "claim_unverified", id, sid, `claim ${c.key} = ${c.value}: ${v.detail}`);
      }
    }

    for (const r of e.relations) {
      const to = entityIdBySlug.get(r.to);
      if (!to) throw new DatasetError(`entity ${e.slug}: unknown relation target ${r.to}`);
      const sid = r.sourceId ?? primary;
      if (sid && !sourceIds.has(sid)) throw new DatasetError(`entity ${e.slug}: unknown relation source ${sid}`);
      const v = judge(sid ? checks.get(sid) : undefined, r.claimEvidence, "unreviewed");
      markVerified(v);
      if (v.issue) issue(v.issue === "claim_unverified" ? "relation_unverified" : v.issue, id, sid, `${r.type} ${r.to}: ${v.detail}`);
      entityRelations.push({ id: stableId("relation", `entity:${e.slug}:${r.type}:${r.to}`), fromEntityId: id, toEntityId: to, relationType: r.type, sourceId: sid, evidence: r.claimEvidence ?? null, reviewStatus: v.status, verifiedAt: v.verifiedAt });
    }

    let reviewStatus: ReviewStatus = "unreviewed";
    if (primaryCheck?.outcome === "not_found") reviewStatus = "stale";
    else if (anyVerified) reviewStatus = "verified";
    else if (primaryCheck?.outcome === "ok") reviewStatus = "imported";

    return {
      id, slug: e.slug, name: e.name, entityType: e.entityType, status: e.status,
      shortDescription: e.shortDescription ?? null, officialUrl: e.officialUrl ?? null,
      sensitiveLocation: e.sensitiveLocation, visibility: e.visibility, reviewStatus,
      verifiedAt: latestVerified, createdAt, updatedAt: primaryCheck?.checkedAt ?? createdAt,
      aliases: e.aliases, primarySourceId: primary,
      lat: null as number | null, lon: null as number | null, wikidataId: null as string | null, prominence: 0,
      wikipedia: null as { title: string; url: string; extract: string; retrievedAt: string } | null,
    };
  });

  const entityCategories = curated.entities.flatMap((e) => {
    const primaries = e.categories.filter((c) => c.primary).length;
    if (primaries !== 1) throw new DatasetError(`entity ${e.slug}: needs exactly one primary category`);
    return e.categories.map((c) => {
      const categoryId = categoryIdBySlug.get(c.slug);
      if (!categoryId) throw new DatasetError(`entity ${e.slug}: unknown category ${c.slug}`);
      return { entityId: entityIdBySlug.get(e.slug)!, categoryId, isPrimary: c.primary };
    });
  });

  const externalIds = curated.entities.flatMap((e) => e.externalIds.map((x) => ({ entityId: entityIdBySlug.get(e.slug)!, provider: x.provider, externalId: x.id })));
  const extKeys = new Set<string>();
  for (const x of externalIds) {
    const k = `${x.provider}:${x.externalId}`;
    if (extKeys.has(k)) throw new DatasetError(`duplicate external id ${k}`);
    extKeys.add(k);
  }

  const mediaRows = media.map((m) => ({
    id: stableId("media", m.id),
    areaId: m.subjectKind === "area" ? areaId(m.subjectSlug, `media ${m.id}`) : null,
    entityId: m.subjectKind === "entity" ? (entityIdBySlug.get(m.subjectSlug) ?? null) : null,
    kind: m.kind, url: m.url, pageUrl: m.pageUrl, alt: m.alt, credit: m.credit, license: m.license, licenseUrl: m.licenseUrl,
    year: m.year ?? null, aiGenerated: m.aiGenerated,
  }));

  // ---- enrichment bundles (Wikidata places, OSM brands): enrich curated entities or add new ones
  const entityIdByQid = new Map<string, string>();
  const pendingRelations: { from: string; type: string; toQid: string }[] = [];
  const relKeys2 = new Set(entityRelations.map((r) => `${r.fromEntityId}|${r.relationType}|${r.toEntityId}`));
  for (const bundle of inputs.enrichments) {
    for (const s of bundle.sources) if (!sourceIds.has(s.id)) addSource(s, null);
    const bundleTime = bundle.generatedAt;
    for (const r of bundle.entities) {
      if (entityIdByQid.has(r.qid)) {
        // Already added by an earlier bundle (another area): add its area links and per-area (scoped) facts only.
        const id = entityIdByQid.get(r.qid)!;
        const slugOf = entities.find((x) => x.id === id)!.slug;
        for (const f of r.facts) {
          if (!f.scopeAreaSlug) continue;
          const fid = stableId("fact", `entity:${slugOf}:${f.key}:${f.sourceId}:${f.scopeAreaSlug}`);
          if (facts.some((x) => x.id === fid)) continue;
          facts.push({
            id: fid, areaId: null, entityId: id, key: f.key, valueText: typeof f.value === "string" ? f.value : null, valueNum: typeof f.value === "number" ? f.value : null,
            unit: f.unit ?? null, asOf: f.asOf ?? null, asOfLabel: null, sourceId: f.sourceId, sourceRef: f.sourceRef,
            reviewStatus: "imported", verifiedAt: null, note: null, scopeAreaId: areaId(f.scopeAreaSlug, `fact ${f.key}`),
          });
        }
        const row0 = entities.find((x) => x.id === id)!;
        row0.prominence = Math.max(row0.prominence, r.prominence ?? 0);
        for (const a of r.areas) if (!entityAreas.some((x) => x.entityId === id && x.areaId === areaIdBySlug.get(a.slug) && x.relationType === a.relation))
          entityAreas.push({ entityId: id, areaId: areaId(a.slug, `enrich ${r.slug}`), relationType: a.relation, reviewStatus: "imported", evidence: null, verifiedAt: null, note: r.origin === "osm-brand" ? "Mapped locations in OpenStreetMap" : "Wikidata coordinates / statements" });
        continue;
      }
      let row = r.curatedSlug ? entities.find((e) => e.slug === r.curatedSlug) : undefined;
      if (!row) {
        if (entityIdBySlug.has(r.slug) || areaIdBySlug.has(r.slug)) throw new DatasetError(`enrichment slug collision ${r.slug}`);
        const id = stableId("entity", r.slug);
        entityIdBySlug.set(r.slug, id);
        const desc = r.description ? r.description.charAt(0).toUpperCase() + r.description.slice(1) : null;
        row = {
          id, slug: r.slug, name: r.name, entityType: r.entityType as EntityRow["entityType"], status: r.status,
          shortDescription: desc && desc.length <= 280 ? desc : null, officialUrl: r.officialUrl ?? null,
          sensitiveLocation: false, visibility: "public", reviewStatus: "imported", verifiedAt: null,
          createdAt: bundleTime, updatedAt: bundleTime, aliases: r.aliases, primarySourceId: "wikidata",
          lat: null, lon: null, wikidataId: null, wikipedia: null, prominence: 0,
        };
        entities.push(row);
        r.categories.forEach((c) => {
          const categoryId = categoryIdBySlug.get(c.slug);
          if (!categoryId) throw new DatasetError(`enrichment ${r.slug}: unknown category ${c.slug}`);
          entityCategories.push({ entityId: id, categoryId, isPrimary: c.primary });
        });
        for (const a of r.areas)
          entityAreas.push({ entityId: id, areaId: areaId(a.slug, `enrich ${r.slug}`), relationType: a.relation, reviewStatus: "imported", evidence: null, verifiedAt: null, note: r.origin === "osm-brand" ? "Mapped locations in OpenStreetMap" : "Wikidata coordinates / statements" });
      } else {
        row.officialUrl ??= r.officialUrl ?? null;
        // Add the Wikidata-backed area links (coordinates / statements) the curated record lacks or has only unverified.
        const curatedId = row.id;
        for (const a of r.areas) {
          const aId = areaId(a.slug, `enrich ${r.slug}`);
          const existing = entityAreas.find((x) => x.entityId === curatedId && x.areaId === aId && x.relationType === a.relation);
          if (!existing) entityAreas.push({ entityId: curatedId, areaId: aId, relationType: a.relation, reviewStatus: "imported", evidence: null, verifiedAt: null, note: "Wikidata coordinates / statements" });
          else if (existing.reviewStatus === "unreviewed") {
            existing.reviewStatus = "imported";
            existing.note = "Confirmed by Wikidata coordinates / statements";
          }
        }
      }
      const id = row.id;
      entityIdByQid.set(r.qid, id);
      if (r.coords && !row.sensitiveLocation) {
        row.lat = r.coords.lat;
        row.lon = r.coords.lon;
      }
      row.wikidataId = r.qid;
      row.prominence = Math.max(row.prominence, r.prominence ?? 0);
      if (r.wikipedia?.extract) row.wikipedia = r.wikipedia;
      for (const f of r.facts) {
        facts.push({
          id: stableId("fact", `entity:${row.slug}:${f.key}:${f.sourceId}:${f.scopeAreaSlug ?? ""}`), areaId: null, entityId: id, key: f.key,
          valueText: typeof f.value === "string" ? f.value : null, valueNum: typeof f.value === "number" ? f.value : null,
          unit: f.unit ?? null, asOf: f.asOf ?? null, asOfLabel: null, sourceId: f.sourceId, sourceRef: f.sourceRef,
          reviewStatus: "imported", verifiedAt: null, note: null, scopeAreaId: f.scopeAreaSlug ? areaId(f.scopeAreaSlug, `fact ${f.key}`) : null,
        });
      }
      for (const x of r.externalIds) {
        const k = `${x.provider}:${x.id}`;
        if (extKeys.has(k)) continue;
        extKeys.add(k);
        externalIds.push({ entityId: id, provider: x.provider, externalId: x.id });
      }
      r.media.forEach((m, i) => mediaRows.push({
        id: stableId("media", `${r.qid}:${i}`), areaId: null, entityId: id, kind: m.kind, url: m.url, pageUrl: m.pageUrl, alt: m.alt,
        credit: m.credit, license: m.license, licenseUrl: m.licenseUrl, year: null, aiGenerated: false,
      }));
      for (const rel of r.relations) pendingRelations.push({ from: id, type: rel.type, toQid: rel.targetQid });
    }
  }
  for (const p of pendingRelations) {
    const to = entityIdByQid.get(p.toQid);
    if (!to || to === p.from || relKeys2.has(`${p.from}|${p.type}|${to}`)) continue;
    relKeys2.add(`${p.from}|${p.type}|${to}`);
    entityRelations.push({ id: stableId("relation", `entity-id:${p.from}:${p.type}:${to}`), fromEntityId: p.from, toEntityId: to, relationType: p.type, sourceId: "wikidata", evidence: null, reviewStatus: "imported", verifiedAt: null });
  }

  const coverageUniverses = [...census.coverageUniverses, ...(geo?.coverageUniverses ?? [])].map((u) => ({
    id: u.id, areaId: areaId(u.areaSlug, `universe ${u.id}`), label: u.label, definition: u.definition,
    areaType: u.areaType ?? null, categoryId: u.categorySlug ? (categoryIdBySlug.get(u.categorySlug) ?? null) : null,
    denominator: u.denominator, asOf: u.asOf, sourceId: u.sourceId, metric: u.metric, relationType: u.relationType ?? null,
  }));

  // County websites (Wikidata): register each as an official_website source and apply its link check.
  for (const f of facts) {
    if (f.key !== "official-website" || !f.areaId || !f.valueText) continue;
    const county = areas.find((a) => a.id === f.areaId)!;
    const sid = countyWebsiteSourceId(county.slug);
    if (!sourceIds.has(sid)) {
      addSource({
        id: sid, kind: "official_website", title: `${county.name} — official website`, publisher: county.name, url: f.valueText,
        license: "Cited as a reference link; page content is not redisplayed", redisplayPermitted: false, expectedFields: [],
        retrievalMethod: "Automated link check (single GET, robots.txt respected)", refreshInterval: "Quarterly link check",
      }, null);
    }
    const check = checks.get(sid);
    const v = judge(check, countyShortName(county.slug), f.reviewStatus);
    f.reviewStatus = v.status;
    f.verifiedAt = v.verifiedAt;
    if (check && check.url === f.valueText && !sourceRecords.some((r) => r.sourceId === sid)) {
      sourceRecords.push({
        id: stableId("fact", `linkcheck:${sid}:${check.checkedAt}`), sourceId: sid, importRunId: null, externalRef: check.url, retrievedAt: check.checkedAt,
        httpStatus: check.httpStatus, outcome: check.outcome, pageTitle: check.pageTitle, finalUrl: check.finalUrl, checksumSha256: check.bodySha256,
      });
    }
    if (v.issue) reviewIssues.push({ id: stableId("fact", `issue:${v.issue}:${county.slug}:website`), kind: v.issue === "claim_unverified" ? "claim_unverified" : v.issue, entityId: null, areaId: county.id, sourceId: sid, detail: `official website ${f.valueText}: ${v.detail}`, status: "open", createdAt });
  }

  for (const f of facts) if (!sourceIds.has(f.sourceId)) throw new DatasetError(`fact ${f.key}: unknown source ${f.sourceId}`);

  return {
    builtAt: linkChecks?.generatedAt ?? census.generatedAt,
    areas, areaRelations, categories, entities, entityCategories, entityAreas, entityRelations, externalIds,
    sources, sourceRecords, facts, media: mediaRows, reviewIssues, coverageUniverses,
  };
}
