import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { formatDate, humanize, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t("sources.title") };

export default async function SourcesPage() {
  const sources = await getProvider().listSources();
  const groups = ["dataset", "directory", "reference", "official_website"] as const;
  return (
    <div className="container-page pt-8">
      <SectionHeading eyebrow="Provenance" title={t("sources.title")} />
      <p className="prose-note -mt-2 mb-6 max-w-3xl">{t("sources.lede")}</p>
      {groups.map((g) => {
        const list = sources.filter((s) => s.kind === g);
        if (!list.length) return null;
        return (
          <section key={g} className="mb-10" aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="panel-title">
              {humanize(g)}s <span className="text-sm text-muted">({list.length})</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="table-data" data-testid={`sources-${g}`}>
                <thead>
                  <tr>
                    <th scope="col">Source</th>
                    <th scope="col">{t("sources.license")}</th>
                    <th scope="col">{g === "dataset" ? t("sources.retrieved") : t("sources.lastCheck")}</th>
                    <th scope="col" className="text-right">{t("sources.usage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} id={s.id}>
                      <td className="max-w-md">
                        <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a>
                        <span className="block text-xs text-muted">{s.publisher}{s.datasetVersion ? ` · ${s.datasetVersion}` : ""}</span>
                        {s.limitations && <span className="block text-xs text-muted">{t("sources.limitations")}: {s.limitations}</span>}
                        {s.checksumSha256 && <span className="block font-mono text-[10px] break-all text-muted">{t("sources.checksum")} {s.checksumSha256}</span>}
                      </td>
                      <td className="text-xs text-ink-soft">
                        {s.license}
                        <span className="block text-muted">{t("sources.redisplay")}: {s.redisplayPermitted ? t("common.yes") : t("common.no")}</span>
                      </td>
                      <td className="text-xs">
                        {g === "dataset" ? (
                          formatDate(s.retrievedAt)
                        ) : s.lastCheck ? (
                          <>
                            {formatDate(s.lastCheck.retrievedAt)}
                            <span className={`block ${s.lastCheck.outcome === "ok" ? "text-mint" : s.lastCheck.outcome === "not_found" ? "text-danger" : "text-warn"}`}>
                              {s.lastCheck.outcome}{s.lastCheck.httpStatus ? ` · HTTP ${s.lastCheck.httpStatus}` : ""}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">{s.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
