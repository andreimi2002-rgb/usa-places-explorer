import type { Metadata } from "next";
import Link from "next/link";
import { AreaMap, type MapPoint } from "@/components/area-map";
import { EmptyState, EntityGrid, FactTable, SectionHeading, SourceList, factLabel, formatFactValue } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { loadGeometry, loadPlaceGeometry } from "@/lib/data/inputs";
import type { AreaDetail, AreaSummary } from "@/lib/data/types";
import { catName, getLocale, t } from "@/lib/i18n";
import { formatNumber } from "@/lib/text";
import { PlaceHeader, loadArea } from "./shared";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await getProvider().getArea(slug);
  if (!area) return { title: t("common.notFound") };
  return { title: area.name, description: `${area.name} — ${area.typeLabel ?? area.areaType} in the America 360 atlas.`, alternates: { canonical: `/places/${area.slug}` } };
}

const CENSUS_ATTRIBUTION = "County and state outlines: U.S. Census Bureau 2024 cartographic boundaries (1:20m). Place boundaries: Census 2025 (1:500k, simplified). Points: Census 2026 Gazetteer and USGS GNIS. Generalized; not for legal use.";

const displayUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

function point(a: AreaSummary, emphasis = false): MapPoint | null {
  return a.lat !== null && a.lon !== null ? { lat: a.lat, lon: a.lon, label: a.name, href: `/places/${a.slug}`, emphasis } : null;
}

function AreaList({ items, testId }: { items: AreaSummary[]; testId?: string }) {
  const locale = getLocale();
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" data-testid={testId}>
      {items.map((a) => (
        <li key={a.slug}>
          <Link href={`/places/${a.slug}`} className="card-link block px-3 py-2">
            <span className="block text-sm text-ink">{a.name}</span>
            <span className="block text-[11px] text-muted">
              {a.typeLabel}
              {a.populationEstimate !== null ? ` · ${formatNumber(a.populationEstimate, locale)}` : ""}
              {a.programStatus === "active" ? " · ●" : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function KeyFacts({ area }: { area: AreaDetail }) {
  const pick = (k: string) => area.facts.find((f) => f.key === k);
  const cards = ["population-estimate", "population-estimates-base-2020", "land-area", "water-area"].map(pick).filter((f) => !!f);
  if (!cards.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="key-facts">
      {cards.map((f) => (
        <div key={f.id} className="card p-4">
          <p className="font-serif text-2xl text-gold tabular-nums sm:text-3xl">{formatFactValue(f)}</p>
          <p className="mt-1 text-xs text-ink-soft">{factLabel(f.key)}</p>
          <p className="text-[11px] text-muted">{f.asOfLabel}</p>
        </div>
      ))}
    </div>
  );
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const area = await loadArea(slug);
  const db = getProvider();
  const geo = loadGeometry();
  const isFlorida = area.slug === "florida" || area.breadcrumbs.some((c) => c.slug === "florida");
  const primaryCounty =
    area.areaType === "county" ? area.slug : [...area.breadcrumbs].reverse().find((c) => c.areaType === "county")?.slug ??
      area.related.find((r) => r.area.areaType === "county")?.area.slug;

  const [tree, entities, counties, municipalities, neighborhoods, cdps, communities] = await Promise.all([
    db.getCategoryTree(area.slug),
    db.listEntities({ areaSlug: area.slug, pageSize: 6 }),
    area.areaType === "country"
      ? db.listChildAreas(area.slug, { pageSize: 100 })
      : area.areaType === "state"
        ? db.listChildAreas(area.slug, { areaType: "county", pageSize: 100 })
        : null,
    area.areaType === "county" ? db.listChildAreas(area.slug, { areaType: "municipality", pageSize: 500 }) : null,
    area.areaType === "municipality" ? db.listChildAreas(area.slug, { areaType: "neighborhood", pageSize: 100 }) : null,
    area.areaType === "county" ? db.listChildAreas(area.slug, { areaType: "cdp", pageSize: 500 }) : null,
    area.areaType === "county" || area.areaType === "municipality" || area.areaType === "state"
      ? db.listChildAreas(area.slug, { areaType: "community", deep: true, pageSize: 1 })
      : null,
  ]);
  const flMunis = area.slug === "florida" ? await db.listChildAreas("florida", { areaType: "municipality", deep: true, pageSize: 1 }) : null;
  const cdpsInCounty = cdps?.items ?? [];
  const countyLinks = area.related.filter((r) => r.direction === "out" && r.relationType === "intersects" && r.area.areaType === "county");
  const seatRel = area.related.find((r) => r.relationType === "county_seat" && r.direction === "out");
  const seatOf = area.related.filter((r) => r.relationType === "county_seat" && r.direction === "in");
  const seatFact = area.facts.find((f) => f.key === "county-seat");
  const websiteFact = area.facts.find((f) => f.key === "official-website");
  const sourceTitle = (id: string | undefined) => area.sources.find((x) => x.id === id)?.title ?? id;
  const placeGeo = loadPlaceGeometry();
  const shape = (a: { slug: string; name: string }) => {
    const g = placeGeo.get(a.slug);
    return g ? { ...g, properties: { slug: a.slug, name: a.name } } : null;
  };
  const domainsWithEntries = tree.filter((d) => d.entityCount > 0);

  // ---- map
  let map: React.ReactNode = null;
  if (area.areaType === "country" || (area.areaType !== "county" && !isFlorida && ["state", "territory", "federal_district"].includes(area.areaType))) {
    map = (
      <AreaMap collection={geo.states} projection="albers-usa" highlight={area.areaType === "country" ? ["florida"] : [area.slug]} activeSlugs={["florida"]} width={720} height={440}
        title={`Map of ${area.name}`} attribution={CENSUS_ATTRIBUTION} />
    );
  } else if (area.slug === "florida") {
    map = <AreaMap collection={geo.floridaCounties} title="Map of Florida's 67 counties" attribution={CENSUS_ATTRIBUTION} highlight={["duval-county-fl"]} />;
  } else if (primaryCounty && isFlorida) {
    const pts: MapPoint[] = [];
    const overlayAreas = area.areaType === "county" ? [...(municipalities?.items ?? []), ...cdpsInCounty] : area.areaType === "municipality" || area.areaType === "cdp" ? [area] : [];
    const overlay = overlayAreas.map(shape).filter((x) => x !== null);
    if (area.areaType === "county") for (const m of municipalities?.items ?? []) { const p = point(m); if (p && !placeGeo.has(m.slug)) pts.push(p); }
    const self = area.areaType !== "county" ? point(area, true) : null;
    if (self) pts.push(self);
    map = (
      <AreaMap collection={geo.floridaCounties} fitSlug={primaryCounty} highlight={area.areaType === "county" ? [primaryCounty] : [area.slug]} overlay={overlay} points={pts} width={640} height={460}
        title={`Map of ${area.name} within ${primaryCounty.replace(/-fl$/, "").replace(/-/g, " ")}`} attribution={CENSUS_ATTRIBUTION} />
    );
  }

  const codes: [string, string | null][] = [
    ["GEOID", area.geoid], ["FIPS", area.fips], ["ANSI / GNIS", area.ansi], ["USPS", area.usps],
  ];

  return (
    <>
      <PlaceHeader area={area} tab="overview" />
      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-10">
          {area.programStatus === "registry_only" && <EmptyState title={t("area.registryOnly")} hint={area.boundaryNote ?? undefined} />}
          {area.programStatus === "active" && area.boundaryNote && <p className="prose-note">{area.boundaryNote}</p>}

          <section aria-labelledby="facts">
            <SectionHeading eyebrow={t("area.facts")} title={area.areaType === "municipality" ? "City profile" : t("area.facts")} />
            <KeyFacts area={area} />
            {area.facts.length > 0 ? (
              <div className="mt-4">
                <FactTable facts={area.facts} sources={area.sources} />
              </div>
            ) : (
              <EmptyState title={t("area.notYet")} />
            )}
          </section>

          {map && (
            <section aria-labelledby="map">
              <SectionHeading eyebrow={t("area.map")} title={area.areaType === "neighborhood" ? t("area.map") : `${area.name}`} />
              {map}
            </section>
          )}
          {area.areaType === "neighborhood" && area.lat === null && <EmptyState title={t("area.map")} hint="No official boundary or coordinates are documented for this informal area, so no map is drawn." />}
          {(area.areaType === "neighborhood" || area.areaType === "community") && area.lat !== null && (
            <p className="prose-note -mt-6">The dot is the officially named point from USGS GNIS. No legal boundary exists, so none is drawn.</p>
          )}

          {counties && counties.items.length > 0 && (
            <section aria-labelledby="children">
              <SectionHeading eyebrow={area.areaType === "country" ? "States" : `${counties.items.filter((c) => c.areaType === "county").length} ${t("area.counties").toLowerCase()}`} title={area.areaType === "country" ? t("home.statesTitle") : t("area.counties")}>
                <Link href={`/places/${area.slug}/localities`} className="text-sm">{t("area.localities")} →</Link>
              </SectionHeading>
              <AreaList items={counties.items} testId="child-areas" />
              {area.slug === "florida" && flMunis && (
                <p className="prose-note mt-3">
                  {flMunis.total} incorporated municipalities and {area.childCounts.cdp ?? 0} census designated places are listed under{" "}
                  <Link href={`/places/${area.slug}/localities`}>{t("area.localities")}</Link>.
                </p>
              )}
            </section>
          )}

          {area.areaType === "county" && (
            <section aria-labelledby="county-profile">
              <SectionHeading eyebrow="County profile" title={t("area.municipalities")} />
              <dl className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="card p-4" data-testid="county-seat">
                  <dt className="text-xs text-muted">{t("area.countySeat")}</dt>
                  <dd className="mt-1 text-sm">
                    {seatRel ? (
                      <Link href={`/places/${seatRel.area.slug}`}>{seatRel.area.name}</Link>
                    ) : seatFact ? (
                      <span className="text-ink-soft">{seatFact.valueText} <span className="text-[11px] text-warn">(not matched to a Census place, unreviewed)</span></span>
                    ) : (
                      <span className="text-ink-soft">{t("area.notYet")}</span>
                    )}
                  </dd>
                  {(seatRel || seatFact) && <dd className="mt-1 text-[11px] text-muted">Source: {sourceTitle(seatRel ? "wikidata-fl-county-seats" : seatFact?.sourceId)}</dd>}
                </div>
                <div className="card p-4" data-testid="county-website">
                  <dt className="text-xs text-muted">{t("area.officialWebsite")}</dt>
                  <dd className="mt-1 text-sm break-all">
                    {websiteFact?.valueText ? (
                      <a href={websiteFact.valueText} target="_blank" rel="noopener noreferrer">{displayUrl(websiteFact.valueText)} ↗</a>
                    ) : (
                      <span className="text-ink-soft">{t("area.notYet")}</span>
                    )}
                  </dd>
                  {websiteFact && <dd className="mt-1 text-[11px] text-muted">Source: {sourceTitle(websiteFact.sourceId)}</dd>}
                </div>
              </dl>
              <p className="prose-note mb-4">County seats and websites come from Wikidata (CC0) because the Florida Department of State directory refuses automated access. Treat them as a secondary source until reviewed.</p>
              {municipalities && municipalities.items.length ? <AreaList items={municipalities.items} testId="county-municipalities" /> : <EmptyState title={t("area.notYet")} />}
              {cdpsInCounty.length > 0 && (
                <>
                  <h3 className="mt-6 mb-2 text-lg">{t("area.cdps")}</h3>
                  <p className="prose-note mb-3">CDPs whose largest area share lies in this county (2025 Census boundaries). A CDP can extend into neighboring counties.</p>
                  <AreaList items={cdpsInCounty} />
                </>
              )}
            </section>
          )}

          {neighborhoods && neighborhoods.items.length > 0 && (
            <section aria-labelledby="neighborhoods">
              <SectionHeading eyebrow="Areas" title={t("area.neighborhoods")} />
              <p className="prose-note mb-3">Informal, visitor-facing names (Visit Jacksonville). No official boundaries are imported yet.</p>
              <AreaList items={neighborhoods.items} testId="neighborhoods" />
            </section>
          )}

          {communities && communities.total > 0 && (
            <section aria-labelledby="named-places" data-testid="named-places">
              <SectionHeading eyebrow="USGS GNIS" title={area.areaType === "municipality" ? "Named places within the city" : "Communities & named places"}>
                <Link href={`/places/${area.slug}/localities?type=community`} className="text-sm">{t("area.viewAll")} →</Link>
              </SectionHeading>
              <p className="prose-note">
                {communities.total.toLocaleString("en-US")} officially named populated places (communities, neighborhoods, subdivisions, historical settlements)
                {area.areaType === "municipality" ? " lie inside the city limits." : " are recorded here."} They are points without legal boundaries.
              </p>
            </section>
          )}

          <section aria-labelledby="topics-area">
            <SectionHeading eyebrow="Encyclopedia" title={t("area.topics")} />
            {domainsWithEntries.length ? (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="area-topics">
                {tree.map((d) => (
                  <li key={d.slug}>
                    {d.entityCount > 0 ? (
                      <Link href={`/places/${area.slug}/directory?topic=${d.slug}`} className="card-link block px-3 py-2">
                        <span className="block text-sm">{catName(d)}</span>
                        <span className="text-[11px] text-mint">{d.entityCount}</span>
                      </Link>
                    ) : (
                      <span className="card block px-3 py-2 opacity-60">
                        <span className="block text-sm text-ink-soft">{catName(d)}</span>
                        <span className="text-[11px] text-muted">{t("topics.empty")}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t("dir.empty")} hint={t("dir.emptyHint")} />
            )}
          </section>

          {entities.total > 0 && (
            <section aria-labelledby="entries">
              <SectionHeading eyebrow={`${entities.total}`} title={t("area.inThisArea")}>
                <Link href={`/places/${area.slug}/directory`} className="text-sm">{t("area.viewAll")} →</Link>
              </SectionHeading>
              <EntityGrid items={entities.items} />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6" aria-label="Details">
          <section className="card p-4">
            <h2 className="panel-title">{t("area.codes")}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {codes.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-mono text-ink-soft">{v}</dd>
                </div>
              ))}
              {area.aliases.length > 0 && (
                <div className="contents">
                  <dt className="text-muted">Also</dt>
                  <dd className="text-ink-soft">{area.aliases.join(", ")}</dd>
                </div>
              )}
            </dl>
          </section>
          {(countyLinks.length > 0 || seatOf.length > 0) && (
            <section className="card p-4" data-testid="related-geography">
              <h2 className="panel-title">{t("area.related")}</h2>
              <ul className="flex flex-col gap-3 text-sm">
                {seatOf.map((r) => (
                  <li key={`seat-${r.area.slug}`}>
                    <span className="text-muted">County seat of </span>
                    <Link href={`/places/${r.area.slug}`}>{r.area.name}</Link>
                  </li>
                ))}
                {countyLinks.map((r) => (
                  <li key={r.area.slug}>
                    <Link href={`/places/${r.area.slug}`}>{r.area.name}</Link>
                    {r.share !== null && <span className="ml-2 text-xs text-gold tabular-nums">{(r.share * 100).toFixed(1)}%</span>}
                    <span className="block text-[11px] text-muted">{r.relationType === "intersects" ? "Intersects" : "Internal point within"} · {r.method}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2 className="panel-title">{t("entity.sources")}</h2>
            <SourceList sources={area.sources} />
          </section>
          <p className="prose-note">
            <Link href={`/coverage?area=${area.slug}`}>{t("nav.coverage")}: {area.name} →</Link>
          </p>
        </aside>
      </div>
    </>
  );
}
