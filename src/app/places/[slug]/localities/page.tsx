import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, Pagination } from "@/components/ui";
import { getProvider } from "@/lib/data";
import type { AreaType } from "@/lib/domain/schemas";
import { getLocale, t } from "@/lib/i18n";
import { formatNumber } from "@/lib/text";
import { pageParam, param, withQuery } from "@/lib/url";
import { PlaceHeader, loadArea } from "../shared";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await getProvider().getArea(slug);
  return { title: area ? `${area.name} — ${t("area.localities")}` : t("common.notFound") };
}

const TYPES_FOR: Partial<Record<AreaType, AreaType[]>> = {
  country: ["state", "federal_district", "territory"],
  state: ["county", "municipality", "cdp"],
  county: ["municipality"],
};
const TYPE_LABEL: Partial<Record<AreaType, string>> = {
  state: "States", federal_district: "Federal district", territory: "Territories", county: "Counties", municipality: "Municipalities", cdp: "Census designated places",
};

export default async function LocalitiesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const area = await loadArea(slug);
  const types = TYPES_FOR[area.areaType];
  if (!types) notFound();
  const typeParam = param(sp, "type") as AreaType | undefined;
  const type = typeParam && types.includes(typeParam) ? typeParam : types[0]!;
  const q = param(sp, "q");
  const page = pageParam(sp);
  const db = getProvider();
  const deep = area.areaType === "state" && type === "municipality";
  const result = await db.listChildAreas(area.slug, { areaType: type, q, page, pageSize: 60, deep });
  const base = `/places/${area.slug}/localities`;
  const locale = getLocale();

  return (
    <>
      <PlaceHeader area={area} tab="localities" />
      <div className="container-page mt-6">
        <nav aria-label="Locality types" className="mb-4 flex flex-wrap gap-2">
          {types.map((ty) => (
            <Link key={ty} href={withQuery(base, { type: ty })} className={`chip no-underline hover:no-underline ${ty === type ? "border-gold text-gold" : ""}`} aria-current={ty === type ? "page" : undefined}>
              {TYPE_LABEL[ty]}
            </Link>
          ))}
        </nav>
        <form action={base} method="get" className="mb-4 flex max-w-lg gap-2" role="search" aria-label={t("area.filterLocalities")}>
          <input type="hidden" name="type" value={type} />
          <label className="sr-only" htmlFor="loc-q">{t("area.filterLocalities")}</label>
          <input id="loc-q" name="q" type="search" defaultValue={q} placeholder={t("area.filterLocalities")} className="field" />
          <button className="btn" type="submit">{t("dir.filter")}</button>
        </form>
        <p className="mb-3 text-sm text-muted" role="status" data-testid="locality-count">
          {result.total} {TYPE_LABEL[type]?.toLowerCase()} · Source: U.S. Census Bureau (2026 Gazetteer; Vintage 2025 population estimates)
        </p>
        {type === "cdp" && <p className="prose-note mb-3">CDPs are statistical areas defined by the Census Bureau, not incorporated municipalities. Unincorporated communities without a CDP are not yet included.</p>}
        {result.items.length ? (
          <div className="overflow-x-auto">
            <table className="table-data" data-testid="locality-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="text-right">{t("area.population")} (2025 est.)</th>
                  <th scope="col" className="text-right">{t("area.landArea")} (sq mi)</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((a) => (
                  <tr key={a.slug}>
                    <td>
                      <Link href={`/places/${a.slug}`}>{a.name}</Link>
                      {a.programStatus === "active" && <span className="ml-2 text-[11px] text-gold">active</span>}
                    </td>
                    <td className="text-ink-soft">{a.typeLabel}</td>
                    <td className="text-right tabular-nums">{a.populationEstimate !== null ? formatNumber(a.populationEstimate, locale) : <span className="text-muted">—</span>}</td>
                    <td className="text-right tabular-nums">{a.landAreaSqMi !== null ? formatNumber(a.landAreaSqMi, locale) : <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("dir.empty")} />
        )}
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(p) => withQuery(base, { type, q, page: p })} />
      </div>
    </>
  );
}
