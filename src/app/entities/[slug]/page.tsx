import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs, EmptyState, FactTable, SourceList, StatusBadge } from "@/components/ui";
import { getProvider } from "@/lib/data";
import type { EntityDetail, LinkedEntity } from "@/lib/data/types";
import { catName, formatDate, humanize, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const loadEntity = cache(async (slug: string): Promise<EntityDetail> => {
  const db = getProvider();
  const e = await db.getEntity(slug);
  if (e) return e;
  const target = await db.resolveRedirect("entity", slug);
  if (target) permanentRedirect(`/entities/${target}`);
  notFound();
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await getProvider().getEntity(slug);
  if (!e) return { title: t("common.notFound") };
  return { title: e.name, description: e.shortDescription ?? undefined, alternates: { canonical: `/entities/${e.slug}` } };
}

const TRUSTED = new Set(["verified", "reviewed", "imported"]);

const RELATION_LABEL: Record<string, [out: string, inbound: string]> = {
  home_venue: ["Home venue", "Home venue of"],
  operated_by: ["Operated by", "Operates"],
  brand_of: ["Brand", "Branches"],
  affiliated_with: ["Affiliated with", "Affiliated institution"],
  part_of: ["Part of", "Includes"],
  on_waterway: ["On waterway", "Along this waterway"],
  crosses: ["Crosses", "Crossed by"],
  managed_by: ["Managed by", "Manages"],
};

const AREA_RELATION_LABEL: Record<string, string> = {
  located_in: "Located in", headquartered_in: "Headquartered in", serves: "Serves", operates_in: "Operates in", crosses: "Crosses", documented_in: "Documented in",
};

/** Type-specific section titles: what a complete entry of this type should document. */
const TYPE_SECTIONS: Partial<Record<string, string[]>> = {
  shopping_center: ["Operator", "Tenant directory", "Opening date"],
  sports_team: ["League", "Home venue", "Founded"],
  venue: ["Tenants", "Capacity", "Opened"],
  species: ["Taxonomy", "Habitat", "Conservation status"],
  government_body: ["Jurisdiction", "Public services", "Elected offices"],
  agency: ["Jurisdiction", "Public services"],
  store: ["Brand", "Street address", "Hours (sourced only)"],
  brand: ["Branches", "Headquarters"],
  park: ["Managing agency", "Street address", "Amenities"],
  state_park: ["Managing agency", "Acreage", "Amenities"],
  university: ["Type", "Campuses", "Enrollment (dated)"],
};

const SECTION_FACT: Record<string, string> = { League: "league", "Street address": "street-address", Taxonomy: "scientific-name" };
const SECTION_RELATION: Record<string, [string, "in" | "out"]> = {
  Operator: ["operated_by", "out"],
  "Home venue": ["home_venue", "out"],
  Tenants: ["home_venue", "in"],
  Brand: ["brand_of", "out"],
  Branches: ["brand_of", "in"],
  "Managing agency": ["managed_by", "out"],
};

function RelationItem({ r }: { r: LinkedEntity }) {
  const label = RELATION_LABEL[r.relationType]?.[r.direction === "out" ? 0 : 1] ?? humanize(r.relationType);
  return (
    <li className="card flex flex-col gap-1 p-3 text-sm">
      <span className="text-[11px] tracking-wide text-muted uppercase">{label}</span>
      <Link href={`/entities/${r.entity.slug}`} className="font-medium">
        {r.entity.name}
      </Link>
      <span className="text-[11px] text-muted">
        {catName(r.entity.primaryCategory)}
        {r.verifiedAt ? ` · ${t("entity.verifiedOn", { date: formatDate(r.verifiedAt) })}` : ""}
        {r.evidence && r.reviewStatus === "verified" ? ` · ${t("entity.evidence")}: “${r.evidence}”` : ""}
      </span>
    </li>
  );
}

export default async function EntityPage({ params }: Props) {
  const { slug } = await params;
  const e = await loadEntity(slug);
  const trustedAreas = e.areas.filter((a) => TRUSTED.has(a.reviewStatus));
  const pendingAreas = e.areas.filter((a) => !TRUSTED.has(a.reviewStatus));
  const trustedRels = e.relations.filter((r) => TRUSTED.has(r.reviewStatus));
  const pendingRels = e.relations.filter((r) => !TRUSTED.has(r.reviewStatus));
  const sections = TYPE_SECTIONS[e.entityType] ?? [];
  const documentedKeys = new Set(e.facts.map((f) => f.key));

  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={e.breadcrumbs} current={e.name} />
      <article aria-labelledby="entity-title" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="rounded-[20px] border border-line bg-[linear-gradient(120deg,#0f1d2b,#132433)] p-5 sm:p-8">
            <p className="eyebrow">
              {catName(e.domain)} / {catName(e.primaryCategory)}
            </p>
            <h1 id="entity-title" className="mt-3 text-3xl sm:text-5xl">
              {e.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="chip">{humanize(e.entityType)}</span>
              <StatusBadge status={e.reviewStatus} title={e.verifiedAt ? `Verified ${formatDate(e.verifiedAt)}` : undefined} />
              {e.status !== "unknown" && <span className="chip">{humanize(e.status)}</span>}
              {e.aliases.length > 0 && <span className="text-muted">Also: {e.aliases.join(", ")}</span>}
            </div>
            {e.shortDescription && <p className="mt-4 max-w-2xl text-ink-soft">{e.shortDescription}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              {e.officialUrl && (
                <a href={e.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {t("entity.officialSite")} ↗
                </a>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">{t("entity.photoMissing")}</p>
          </header>

          <section aria-labelledby="loc">
            <h2 id="loc" className="panel-title">{t("entity.location")}</h2>
            {trustedAreas.length ? (
              <ul className="flex flex-col gap-2" data-testid="entity-areas">
                {trustedAreas.map((a) => (
                  <li key={`${a.slug}-${a.relationType}`} className="text-sm">
                    <span className="text-muted">{AREA_RELATION_LABEL[a.relationType] ?? humanize(a.relationType)}: </span>
                    <Link href={`/places/${a.slug}`}>{a.name}</Link>
                    {a.verifiedAt && (
                      <span className="ml-2 text-[11px] text-muted">
                        {t("entity.verifiedOn", { date: formatDate(a.verifiedAt) })} · {t("entity.evidence")}: “{a.evidence}”
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t("area.notYet")} />
            )}
            <p className="prose-note mt-3">{e.sensitiveLocation ? t("entity.sensitive") : t("entity.noCoordinates")}</p>
          </section>

          <section aria-labelledby="facts">
            <h2 id="facts" className="panel-title">{t("entity.facts")}</h2>
            {e.facts.length ? <FactTable facts={e.facts} sources={e.sources} /> : <EmptyState title={t("entity.noFacts")} />}
            {sections.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Type-specific sections" data-testid="type-sections">
                {sections.map((s) => {
                  const fact = SECTION_FACT[s];
                  const rel = SECTION_RELATION[s];
                  const has = (fact && documentedKeys.has(fact)) || (rel && trustedRels.some((r) => r.relationType === rel[0] && r.direction === rel[1]));
                  return (
                    <li key={s} className={`card p-3 text-xs ${has ? "" : "opacity-70"}`}>
                      <span className="block text-ink-soft">{s}</span>
                      <span className={has ? "text-mint" : "text-muted"}>{has ? "Documented on this page" : t("area.notYet")}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="rels">
            <h2 id="rels" className="panel-title">{t("entity.relations")}</h2>
            {trustedRels.length ? (
              <ul className="grid gap-2 sm:grid-cols-2" data-testid="entity-relations">
                {trustedRels.map((r) => (
                  <RelationItem key={`${r.relationType}-${r.direction}-${r.entity.slug}`} r={r} />
                ))}
              </ul>
            ) : (
              <EmptyState title={t("area.notYet")} />
            )}
          </section>

          {(pendingAreas.length > 0 || pendingRels.length > 0) && (
            <section aria-labelledby="pending" className="rounded-[var(--radius-card)] border border-dashed border-warn/40 p-4" data-testid="pending-review">
              <h2 id="pending" className="panel-title text-warn">{t("entity.pending")}</h2>
              <p className="prose-note mb-3">{t("entity.pendingNote")}</p>
              <ul className="flex flex-col gap-1 text-sm">
                {pendingAreas.map((a) => (
                  <li key={`pa-${a.slug}-${a.relationType}`}>
                    <span className="text-muted">{AREA_RELATION_LABEL[a.relationType] ?? a.relationType}: </span>
                    <Link href={`/places/${a.slug}`}>{a.name}</Link> <StatusBadge status={a.reviewStatus} />
                    {a.note && <span className="ml-2 text-[11px] text-muted">{a.note}</span>}
                  </li>
                ))}
                {pendingRels.map((r) => (
                  <li key={`pr-${r.relationType}-${r.entity.slug}`}>
                    <span className="text-muted">{RELATION_LABEL[r.relationType]?.[r.direction === "out" ? 0 : 1] ?? r.relationType}: </span>
                    <Link href={`/entities/${r.entity.slug}`}>{r.entity.name}</Link> <StatusBadge status={r.reviewStatus} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6" aria-label="Details">
          <section className="card p-4">
            <h2 className="panel-title">{t("entity.classification")}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {e.categories.map((c) => (
                <li key={c.slug}>
                  {c.path.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && <span className="text-muted"> › </span>}
                      <Link href={`/topics/${p.slug}`}>{catName(p)}</Link>
                    </span>
                  ))}
                  {c.isPrimary && <span className="ml-2 text-[11px] text-gold">primary</span>}
                </li>
              ))}
            </ul>
          </section>
          {e.externalIds.length > 0 && (
            <section className="card p-4">
              <h2 className="panel-title">{t("entity.externalIds")}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {e.externalIds.map((x) => (
                  <div key={x.provider} className="contents">
                    <dt className="text-muted">{x.provider}</dt>
                    <dd className="font-mono">{x.externalId}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <section>
            <h2 className="panel-title">{t("entity.sources")}</h2>
            {e.sources.length ? <SourceList sources={e.sources} /> : <EmptyState title={t("area.notYet")} />}
          </section>
          <section className="card p-4 text-xs text-muted">
            <p>
              Record created {formatDate(e.createdAt)} · updated {formatDate(e.updatedAt)}
              {e.verifiedAt ? ` · verified ${formatDate(e.verifiedAt)}` : ""}
            </p>
            {e.openIssues > 0 && <p className="mt-1 text-warn">{t("entity.openIssues", { n: e.openIssues })}</p>}
            <p className="mt-2">
              <strong className="text-ink-soft">{t("entity.report")}:</strong> {t("entity.reportNote")}
            </p>
          </section>
        </aside>
      </article>
    </div>
  );
}
