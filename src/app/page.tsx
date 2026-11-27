import Link from "next/link";
import { AreaMap } from "@/components/area-map";
import { EntityGrid, SectionHeading, StatCard } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { loadGeometry } from "@/lib/data/inputs";
import { catName, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getProvider();
  const [stats, tree, verified, florida] = await Promise.all([
    db.getStats(),
    db.getCategoryTree(),
    db.listEntities({ reviewStatus: "verified", pageSize: 6, areaSlug: "jacksonville-fl" }),
    db.getArea("florida"),
  ]);
  const geo = loadGeometry();
  const muni = await db.listChildAreas("florida", { areaType: "municipality", deep: true, pageSize: 1 });

  return (
    <>
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_85%_10%,#1d3a44_0,transparent_55%),linear-gradient(160deg,#0f1d2b,#070f18)]">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-14">
          <div>
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">{t("home.title")}</h1>
            <p className="mt-4 max-w-xl text-ink-soft">{t("home.lede")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/places/florida" className="btn-primary">
                {t("home.explore")} →
              </Link>
              <Link href="/places/jacksonville-fl" className="btn">
                {t("home.pilot")}
              </Link>
            </div>
          </div>
          <div>
            <AreaMap
              collection={geo.states}
              projection="albers-usa"
              highlight={["florida"]}
              activeSlugs={["florida"]}
              width={720}
              height={440}
              title="Map of the United States with Florida highlighted as the active state"
              attribution="Boundaries: U.S. Census Bureau, 2024 cartographic boundary files (1:20m). Alaska and Hawaii inset; Puerto Rico not shown on this projection."
            />
            <p className="mt-2 text-xs text-muted">
              <span className="chip border-gold/60 text-gold">{t("home.activeState")}</span> Florida
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10" aria-labelledby="truth">
        <SectionHeading eyebrow="Dataset" title={t("home.truth")} />
        <p className="prose-note -mt-2 mb-4">{t("home.truthNote")}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard value={stats.areasByType.county ?? 0} label={t("stat.counties")} testId="stat-counties" />
          <StatCard value={muni.total} label={t("stat.municipalities")} />
          <StatCard value={stats.areasByType.cdp ?? 0} label={t("stat.cdps")} />
          <StatCard value={stats.entities} label={t("stat.entities")} />
          <StatCard value={stats.verifiedEntities} label={t("stat.verified")} />
          <StatCard value={stats.facts} label={t("stat.facts")} />
        </div>
        {florida && (
          <p className="prose-note mt-3">
            <Link href="/coverage?area=florida">{t("nav.coverage")} →</Link>
          </p>
        )}
      </section>

      <section className="container-page py-6" aria-labelledby="topics-home">
        <SectionHeading eyebrow="Encyclopedia" title={t("home.topicsTitle")}>
          <Link href="/topics" className="text-sm">
            {t("area.viewAll")} →
          </Link>
        </SectionHeading>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tree.map((d) => (
            <li key={d.slug}>
              <Link href={`/topics/${d.slug}`} className="card-link flex h-full flex-col gap-1">
                <span className="text-[11px] tabular-nums text-muted">{String(d.domainNumber).padStart(2, "0")}</span>
                <span className="font-serif text-base leading-snug">{catName(d)}</span>
                <span className={`mt-auto text-xs ${d.entityCount ? "text-mint" : "text-muted"}`}>
                  {d.entityCount ? `${d.entityCount} ${t("topics.entries").toLowerCase()}` : t("topics.empty")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page py-10" aria-labelledby="discover">
        <SectionHeading eyebrow="Jacksonville" title={t("home.discoverTitle")}>
          <Link href="/places/jacksonville-fl/directory" className="text-sm">
            {t("area.viewAll")} →
          </Link>
        </SectionHeading>
        <EntityGrid items={verified.items} />
      </section>

      <section className="container-page py-6">
        <SectionHeading eyebrow="Atlas" title={t("home.statesTitle")} />
        <p className="prose-note mb-3 max-w-3xl">{t("home.statesNote")}</p>
        <Link href="/places/united-states" className="btn">
          United States →
        </Link>
      </section>
    </>
  );
}
