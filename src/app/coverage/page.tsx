import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { REVIEW_STATUSES } from "@/lib/data/types";
import { catName, formatDate, humanize, t } from "@/lib/i18n";
import { param } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t("coverage.title") };

const SCOPES = ["united-states", "florida", "duval-county-fl", "jacksonville-fl"];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CoveragePage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = param(sp, "area") ?? "florida";
  const db = getProvider();
  const report = await db.getCoverage(raw);
  const statuses = REVIEW_STATUSES.filter((s) => s !== "rejected");

  return (
    <div className="container-page pt-8">
      <SectionHeading eyebrow="Measured, not estimated" title={t("coverage.title")} />
      <p className="prose-note -mt-2 mb-4 max-w-3xl">{t("coverage.lede")}</p>
      <nav aria-label={t("coverage.scope")} className="mb-6 flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <Link key={s} href={`/coverage?area=${s}`} className={`chip no-underline hover:no-underline ${report?.area.slug === s ? "border-gold text-gold" : ""}`} aria-current={report?.area.slug === s ? "page" : undefined}>
            {humanize(s.replace(/-fl$/, "")).replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </nav>

      {!report ? (
        <EmptyState title={t("common.notFound")} />
      ) : (
        <div className="flex flex-col gap-10">
          <section aria-labelledby="universes">
            <h2 id="universes" className="panel-title">{t("coverage.universes")}</h2>
            {report.universes.length ? (
              <div className="overflow-x-auto">
                <table className="table-data" data-testid="universe-table">
                  <thead>
                    <tr>
                      <th scope="col">Registry</th>
                      <th scope="col" className="text-right">In dataset</th>
                      <th scope="col" className="text-right">Universe</th>
                      <th scope="col" className="text-right">%</th>
                      <th scope="col">{t("coverage.definition")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.universes.map((u) => (
                      <tr key={u.id}>
                        <td>{u.label}</td>
                        <td className="text-right tabular-nums">{u.numerator}</td>
                        <td className="text-right tabular-nums">{u.denominator}</td>
                        <td className="text-right tabular-nums">{Math.round((u.numerator / u.denominator) * 1000) / 10}%</td>
                        <td className="text-xs text-muted">
                          {u.definition} Denominator as of {formatDate(u.asOf)}; source <Link href="/sources">{u.sourceId}</Link>.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title={t("coverage.noUniverse")} />
            )}
            <p className="prose-note mt-2">Registry completeness describes geographic records only — not how much of each place&apos;s encyclopedia content exists.</p>
          </section>

          <section aria-labelledby="matrix">
            <h2 id="matrix" className="panel-title">
              {report.area.name} × domain <span className="text-sm text-muted">({report.totals.all} entries)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="table-data" data-testid="coverage-matrix">
                <thead>
                  <tr>
                    <th scope="col">{t("coverage.domain")}</th>
                    {statuses.map((s) => (
                      <th key={s} scope="col" className="text-right">{t(`status.${s}`)}</th>
                    ))}
                    <th scope="col" className="text-right">{t("coverage.total")}</th>
                    <th scope="col">Completeness</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cells.map((c) => (
                    <tr key={c.domain.slug} className={c.total ? "" : "text-muted"}>
                      <td>
                        <Link href={`/topics/${c.domain.slug}`}>{catName(c.domain)}</Link>
                      </td>
                      {statuses.map((s) => (
                        <td key={s} className="text-right tabular-nums">{c.byStatus[s] || ""}</td>
                      ))}
                      <td className="text-right font-medium tabular-nums">{c.total}</td>
                      <td className="text-xs text-muted">{c.total ? "No universe defined — not a percentage" : t("topics.empty")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="text-left">{t("coverage.total")}</th>
                    {statuses.map((s) => (
                      <td key={s} className="text-right font-medium tabular-nums">{report.totals[s]}</td>
                    ))}
                    <td className="text-right font-semibold tabular-nums">{report.totals.all}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <dl className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <div><dt className="inline text-ink-soft">{t("status.verified")}:</dt> <dd className="inline">evidence text found in the cited source page by the automated checker.</dd></div>
              <div><dt className="inline text-ink-soft">{t("status.imported")}:</dt> <dd className="inline">source reachable, no specific claim confirmed yet.</dd></div>
              <div><dt className="inline text-ink-soft">{t("status.unreviewed")}:</dt> <dd className="inline">source blocked automated checks or no claim matched; needs a person.</dd></div>
              <div><dt className="inline text-ink-soft">{t("status.stale")}:</dt> <dd className="inline">source page no longer exists.</dd></div>
            </dl>
          </section>

          <section aria-labelledby="issues">
            <h2 id="issues" className="panel-title">{t("coverage.issues")}</h2>
            {report.openIssues.length ? (
              <ul className="flex flex-wrap gap-2" data-testid="issue-counts">
                {report.openIssues.map((i) => (
                  <li key={i.kind} className="chip">
                    {humanize(i.kind)} <span className="text-warn">{i.n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="prose-note">None.</p>
            )}
          </section>
          <p className="prose-note">Generated from records as of {formatDate(report.generatedAt)}.</p>
        </div>
      )}
    </div>
  );
}
