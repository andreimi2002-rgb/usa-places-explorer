import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { AreaMap } from "@/components/area-map";
import { Breadcrumbs, EmptyState, EntityCard, SourceList, StatusBadge, factLabel, formatFactValue } from "@/components/ui";
import { getProvider } from "@/lib/data";
import type { FactRow } from "@/lib/data/dataset";
import { loadGeometry, loadPlaceGeometry } from "@/lib/data/inputs";
import type { EntityDetail, LinkedEntity } from "@/lib/data/types";
import { catName, formatDate, getLocale, humanize, t } from "@/lib/i18n";
import { commonsThumb } from "@/lib/media";
import { formatNumber } from "@/lib/text";

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
  return { title: e.name, description: e.shortDescription ?? e.wikipedia?.extract.slice(0, 160) ?? undefined, alternates: { canonical: `/entities/${e.slug}` } };
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

/** Infobox order. Anything not listed is appended afterwards. */
const INFOBOX_ORDER = [
  "opened", "inception", "closed", "operator", "owner", "league", "headquarters", "founded-by", "parent-organization",
  "capacity", "area", "height", "floors", "students", "employees", "street-address", "scientific-name", "heritage-designation", "nrhp-reference",
];
const NOT_IN_INFOBOX = new Set(["osm-location-count"]);

/** What a complete entry of this type should document (shown as a checklist, never as invented content). */
const TYPE_SECTIONS: Partial<Record<string, string[]>> = {
  shopping_center: ["Operator", "Tenant directory", "Opening date"],
  sports_team: ["League", "Home venue", "Founded"],
  venue: ["Tenants", "Capacity", "Opened"],
  species: ["Taxonomy", "Habitat", "Conservation status"],
  government_body: ["Jurisdiction", "Public services", "Elected offices"],
  agency: ["Jurisdiction", "Public services"],
  store: ["Brand", "Street address", "Hours (sourced only)"],
  brand: ["Locations", "Headquarters", "Founded"],
  park: ["Managing agency", "Street address", "Amenities"],
  state_park: ["Managing agency", "Acreage", "Amenities"],
  university: ["Type", "Campuses", "Enrollment (dated)"],
  museum: ["Collections", "Opened", "Street address"],
  school: ["Grades", "District", "Enrollment (dated)"],
};
const SECTION_FACT: Record<string, string[]> = {
  League: ["league"], "Street address": ["street-address"], Taxonomy: ["scientific-name"], Capacity: ["capacity"],
  Opened: ["opened", "inception"], "Opening date": ["opened", "inception"], Founded: ["inception", "opened"], Headquarters: ["headquarters"],
  Acreage: ["area"], "Enrollment (dated)": ["students"], Locations: ["osm-location-count"],
};
const SECTION_RELATION: Record<string, [string, "in" | "out"]> = {
  Operator: ["operated_by", "out"], "Home venue": ["home_venue", "out"], Tenants: ["home_venue", "in"],
  Brand: ["brand_of", "out"], Branches: ["brand_of", "in"], "Managing agency": ["managed_by", "out"],
};

/** One value per fact key; verified values win over imported ones. */
function infoboxFacts(facts: FactRow[]): FactRow[] {
  const byKey = new Map<string, FactRow>();
  for (const f of facts) {
    if (NOT_IN_INFOBOX.has(f.key) || f.reviewStatus === "rejected") continue;
    const prev = byKey.get(f.key);
    if (!prev || (f.reviewStatus === "verified" && prev.reviewStatus !== "verified")) byKey.set(f.key, f);
  }
  const rank = (k: string) => (INFOBOX_ORDER.indexOf(k) === -1 ? 999 : INFOBOX_ORDER.indexOf(k));
  return [...byKey.values()].sort((a, b) => rank(a.key) - rank(b.key));
}

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
        {r.verifiedAt ? ` · ${t("entity.verifiedOn", { date: formatDate(r.verifiedAt) })}` : r.sourceId === "wikidata" ? " · Wikidata" : ""}
      </span>
    </li>
  );
}

export default async function EntityPage({ params }: Props) {
  const { slug } = await params;
  const e = await loadEntity(slug);
  const db = getProvider();
  const nearby = e.lat !== null ? await db.nearbyEntities(e.slug, { limit: 6, radiusKm: 3 }) : [];
  const locale = getLocale();

  const trustedAreas = e.areas.filter((a) => TRUSTED.has(a.reviewStatus));
  const pendingAreas = e.areas.filter((a) => !TRUSTED.has(a.reviewStatus));
  const trustedRels = e.relations.filter((r) => TRUSTED.has(r.reviewStatus));
  const pendingRels = e.relations.filter((r) => !TRUSTED.has(r.reviewStatus));
  const photo = e.media.find((m) => m.kind === "photo");
  const logo = e.media.find((m) => m.kind === "illustration");
  const box = infoboxFacts(e.facts);
  const documented = new Set(e.facts.map((f) => f.key));
  const sections = TYPE_SECTIONS[e.entityType] ?? [];

  // Map: fit to the most specific place with a boundary; draw that boundary and the sourced point.
  const placeGeo = loadPlaceGeometry();
  const placeCrumb = [...e.breadcrumbs].reverse().find((c) => placeGeo.has(c.slug));
  const countyCrumb = [...e.breadcrumbs].reverse().find((c) => c.areaType === "county");
  const placeShape = placeCrumb ? { ...placeGeo.get(placeCrumb.slug)!, properties: { slug: placeCrumb.slug, name: placeCrumb.name } } : undefined;
  const counties = loadGeometry().floridaCounties;

  return (
    <div className="pb-6">
      <div className="container-page pt-6">
        <Breadcrumbs items={e.breadcrumbs} current={e.name} />
      </div>

      {/* ---------------------------------------------------------------- hero */}
      <header className="container-page" aria-labelledby="entity-title">
        <div className="relative overflow-hidden rounded-[20px] border border-line bg-[linear-gradient(120deg,#0f1d2b,#132433)]">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- Wikimedia serves sized thumbnails
            <img src={commonsThumb(photo.url, 1280)} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover opacity-60" />
          )}
          {photo && <div className="absolute inset-0 bg-[linear-gradient(0deg,#070f18_5%,#070f18aa_45%,#070f1820_100%)]" />}
          <div className={`relative flex flex-col justify-end gap-3 px-5 sm:px-8 ${photo ? "min-h-[300px] py-6 sm:min-h-[420px] sm:py-8" : "py-8 sm:py-10"}`}>
            {logo && !photo && (
              // eslint-disable-next-line @next/next/no-img-element -- brand logo from Commons
              <img src={commonsThumb(logo.url, 330)} alt={logo.alt} className="h-16 w-auto max-w-[220px] self-start rounded-lg bg-white p-2 object-contain" />
            )}
            <p className="eyebrow">
              {catName(e.domain)} / {catName(e.primaryCategory)}
            </p>
            <h1 id="entity-title" className="text-3xl sm:text-5xl">
              {e.name}
            </h1>
            {e.shortDescription && <p className="max-w-2xl text-ink-soft">{e.shortDescription}</p>}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {e.status !== "active" && e.status !== "unknown" && <span className="chip border-warn/50 text-warn">{humanize(e.status)}</span>}
              {e.placeLabel && <span className="chip">{e.placeLabel}</span>}
              {e.officialUrl && (
                <a href={e.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary ml-auto">
                  {t("entity.officialSite")} ↗
                </a>
              )}
            </div>
          </div>
          {photo && (
            <p className="absolute top-2 right-2 rounded bg-navy-950/80 px-2 py-1 text-[10px] text-ink-soft">
              Photo:{" "}
              <a href={photo.pageUrl} target="_blank" rel="noopener noreferrer">{photo.credit}</a> ·{" "}
              <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>
            </p>
          )}
        </div>
      </header>

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="flex min-w-0 flex-col gap-10">
          {/* ---------------------------------------------------------------- overview */}
          <section aria-labelledby="overview">
            <h2 id="overview" className="panel-title text-2xl">{t("entity.about")}</h2>
            {e.wikipedia ? (
              <>
                <div className="space-y-3 font-serif text-lg leading-relaxed text-ink" data-testid="wikipedia-summary">
                  {e.wikipedia.extract.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <p className="mt-3 text-xs text-muted">
                  From the Wikipedia article{" "}
                  <a href={e.wikipedia.url} target="_blank" rel="noopener noreferrer">“{e.wikipedia.title}”</a>, available under{" "}
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Retrieved {formatDate(e.wikipedia.retrievedAt)}.{" "}
                  <a href={e.wikipedia.url} target="_blank" rel="noopener noreferrer">Read the full article ↗</a>
                </p>
              </>
            ) : e.shortDescription ? (
              <p className="text-ink-soft">{e.shortDescription}</p>
            ) : (
              <EmptyState title={t("area.notYet")} />
            )}
          </section>

          {/* ---------------------------------------------------------------- brand presence */}
          {e.presence.length > 0 && (
            <section aria-labelledby="presence" data-testid="brand-presence">
              <h2 id="presence" className="panel-title">Locations</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {e.presence.map((p) => (
                  <li key={p.areaSlug} className="card flex items-baseline justify-between p-4">
                    <Link href={`/places/${p.areaSlug}`}>{p.areaName}</Link>
                    <span className="font-serif text-2xl text-gold tabular-nums">{formatNumber(p.count, locale)}</span>
                  </li>
                ))}
              </ul>
              <p className="prose-note mt-2">
                Locations mapped in OpenStreetMap (© OpenStreetMap contributors, ODbL) as of {formatDate(e.presence[0]!.asOf)}. A mapped count, not an official store count. Individual locations are added in a later phase.
              </p>
            </section>
          )}

          {/* ---------------------------------------------------------------- location */}
          {(e.lat !== null || trustedAreas.length > 0) && (
            <section aria-labelledby="loc">
              <h2 id="loc" className="panel-title">{t("entity.location")}</h2>
              {e.lat !== null && e.lon !== null && (placeShape || countyCrumb) && (
                <AreaMap
                  collection={counties}
                  fitFeature={placeShape}
                  fitSlug={placeShape ? undefined : countyCrumb?.slug}
                  overlay={placeShape ? [placeShape] : []}
                  points={[{ lat: e.lat, lon: e.lon, label: e.name, emphasis: true }]}
                  width={640}
                  height={400}
                  title={`Location of ${e.name}`}
                  attribution="Point: Wikidata coordinates (CC0). Boundaries: U.S. Census Bureau cartographic boundary files (generalized)."
                />
              )}
              <ul className="mt-3 flex flex-col gap-1 text-sm" data-testid="entity-areas">
                {trustedAreas.map((a) => (
                  <li key={`${a.slug}-${a.relationType}`}>
                    <span className="text-muted">{AREA_RELATION_LABEL[a.relationType] ?? humanize(a.relationType)}: </span>
                    <Link href={`/places/${a.slug}`}>{a.name}</Link>
                  </li>
                ))}
                {e.lat !== null && e.lon !== null && (
                  <li className="text-xs text-muted">
                    {e.lat.toFixed(5)}, {e.lon.toFixed(5)} ·{" "}
                    <a href={`https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lon}#map=16/${e.lat}/${e.lon}`} target="_blank" rel="noopener noreferrer">
                      Open in OpenStreetMap ↗
                    </a>
                  </li>
                )}
              </ul>
              {e.sensitiveLocation && <p className="prose-note mt-2">{t("entity.sensitive")}</p>}
            </section>
          )}
          {e.lat === null && e.presence.length === 0 && <p className="prose-note -mt-6">{e.sensitiveLocation ? t("entity.sensitive") : t("entity.noCoordinates")}</p>}

          {/* ---------------------------------------------------------------- connections */}
          {trustedRels.length > 0 && (
            <section aria-labelledby="rels">
              <h2 id="rels" className="panel-title">{t("entity.relations")}</h2>
              <ul className="grid gap-2 sm:grid-cols-2" data-testid="entity-relations">
                {trustedRels.map((r) => <RelationItem key={`${r.relationType}-${r.direction}-${r.entity.slug}`} r={r} />)}
              </ul>
            </section>
          )}

          {/* ---------------------------------------------------------------- nearby */}
          {nearby.length > 0 && (
            <section aria-labelledby="nearby" data-testid="nearby">
              <h2 id="nearby" className="panel-title">Nearby</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {nearby.map((n) => (
                  <li key={n.slug}>
                    <EntityCard e={n} extra={<span className="mt-auto text-[11px] text-gold-soft">{formatNumber(n.distanceKm, locale)} km away</span>} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------------------------------------------------------------- completeness checklist */}
          {sections.length > 0 && (
            <section aria-labelledby="completeness">
              <h2 id="completeness" className="panel-title text-lg">What a complete entry covers</h2>
              <ul className="grid gap-2 sm:grid-cols-3" data-testid="type-sections">
                {sections.map((s) => {
                  const has = (SECTION_FACT[s] ?? []).some((k) => documented.has(k)) ||
                    (SECTION_RELATION[s] ? trustedRels.some((r) => r.relationType === SECTION_RELATION[s]![0] && r.direction === SECTION_RELATION[s]![1]) : false) ||
                    (s === "Locations" && e.presence.length > 0);
                  return (
                    <li key={s} className={`card p-3 text-xs ${has ? "" : "opacity-70"}`}>
                      <span className="block text-ink-soft">{s}</span>
                      <span className={has ? "text-mint" : "text-muted"}>{has ? "Documented on this page" : t("area.notYet")}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ---------------------------------------------------------------- pending review */}
          {(pendingAreas.length > 0 || pendingRels.length > 0) && (
            <details className="rounded-[var(--radius-card)] border border-dashed border-warn/40 p-4" data-testid="pending-review">
              <summary className="cursor-pointer text-sm text-warn">{t("entity.pending")} ({pendingAreas.length + pendingRels.length})</summary>
              <p className="prose-note my-3">{t("entity.pendingNote")}</p>
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
            </details>
          )}

          {/* ---------------------------------------------------------------- sources & verification */}
          <details className="card p-4" data-testid="sources-panel">
            <summary className="cursor-pointer font-serif text-lg">
              {t("entity.sources")} <span className="ml-2 align-middle"><StatusBadge status={e.reviewStatus} /></span>
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              <p className="prose-note">
                Record created {formatDate(e.createdAt)} · updated {formatDate(e.updatedAt)}
                {e.verifiedAt ? ` · verified ${formatDate(e.verifiedAt)}` : ""}. Infobox values come from the cited sources; values marked ✓ were confirmed on the official website.
                {e.openIssues > 0 && <span className="text-warn"> {t("entity.openIssues", { n: e.openIssues })}.</span>}
              </p>
              {e.sources.length ? <SourceList sources={e.sources} /> : <EmptyState title={t("area.notYet")} />}
              <p className="text-xs text-muted">
                <strong className="text-ink-soft">{t("entity.report")}:</strong> {t("entity.reportNote")}
              </p>
            </div>
          </details>
        </article>

        {/* ---------------------------------------------------------------- infobox */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start" aria-label="Infobox">
          <section className="card overflow-hidden" data-testid="infobox">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element -- Wikimedia thumbnail
              <img src={commonsThumb(photo.url, 500)} alt={photo.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            )}
            {!photo && logo && (
              <div className="flex justify-center bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- brand logo */}
                <img src={commonsThumb(logo.url, 330)} alt={logo.alt} loading="lazy" className="h-20 w-auto object-contain" />
              </div>
            )}
            <div className="p-4">
              <h2 className="font-serif text-xl">{e.name}</h2>
              <p className="mt-1 text-xs text-muted">{humanize(e.entityType)}</p>
              <dl className="mt-4 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                {box.map((f) => (
                  <div key={f.id} className="contents">
                    <dt className="text-muted">{factLabel(f.key)}</dt>
                    <dd className="break-words text-ink">
                      {formatFactValue(f)}
                      {f.reviewStatus === "verified" && <span className="ml-1 text-mint" title={`Verified ${formatDate(f.verifiedAt)}`}>✓</span>}
                    </dd>
                  </div>
                ))}
                {e.aliases.length > 0 && (
                  <div className="contents">
                    <dt className="text-muted">Also known as</dt>
                    <dd className="text-ink-soft">{e.aliases.slice(0, 4).join(", ")}</dd>
                  </div>
                )}
                {e.officialUrl && (
                  <div className="contents">
                    <dt className="text-muted">Website</dt>
                    <dd className="break-all">
                      <a href={e.officialUrl} target="_blank" rel="noopener noreferrer">{e.officialUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>
                    </dd>
                  </div>
                )}
              </dl>
              {box.length === 0 && !e.officialUrl && <p className="mt-3 text-xs text-muted">{t("entity.noFacts")}</p>}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="panel-title text-base">{t("entity.classification")}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {e.categories.map((c) => (
                <li key={c.slug}>
                  {c.path.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && <span className="text-muted"> › </span>}
                      <Link href={`/topics/${p.slug}`}>{catName(p)}</Link>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </section>

          {e.externalIds.length > 0 && (
            <section className="card p-4">
              <h2 className="panel-title text-base">{t("entity.externalIds")}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {e.externalIds.map((x) => (
                  <div key={`${x.provider}-${x.externalId}`} className="contents">
                    <dt className="text-muted">{x.provider}</dt>
                    <dd className="font-mono">
                      {x.provider === "wikidata" ? (
                        <a href={`https://www.wikidata.org/wiki/${x.externalId}`} target="_blank" rel="noopener noreferrer">{x.externalId}</a>
                      ) : (
                        x.externalId
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
