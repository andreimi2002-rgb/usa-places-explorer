import Link from "next/link";
import type { ReviewStatus } from "@/lib/domain/schemas";
import type { Crumb, EntitySummary, SourceCheck } from "@/lib/data/types";
import type { FactRow, SourceRow } from "@/lib/data/dataset";
import { catName, formatDate, humanize, t } from "@/lib/i18n";
import { formatNumber } from "@/lib/text";
import { getLocale } from "@/lib/i18n";
import { commonsThumb } from "@/lib/media";

export function Breadcrumbs({ items, current }: { items: Crumb[]; current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="text-muted hover:text-ink">
            {t("common.home")}
          </Link>
        </li>
        {items.map((c) => (
          <li key={c.slug} className="flex items-center gap-1.5">
            <span aria-hidden="true">›</span>
            <Link href={`/places/${c.slug}`} className="text-muted hover:text-ink">
              {c.name}
            </Link>
          </li>
        ))}
        {current && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">›</span>
            <span aria-current="page" className="text-ink">
              {current}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}

const STATUS_STYLE: Record<ReviewStatus, string> = {
  verified: "border-mint/60 text-mint",
  reviewed: "border-mint/40 text-mint",
  imported: "border-line-strong text-ink-soft",
  unreviewed: "border-warn/50 text-warn",
  stale: "border-danger/60 text-danger",
  rejected: "border-danger text-danger",
};

export function StatusBadge({ status, title }: { status: ReviewStatus; title?: string }) {
  return (
    <span className={`chip ${STATUS_STYLE[status]}`} title={title} data-status={status}>
      {t(`status.${status}`)}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-6 text-sm text-muted" role="status">
      <p className="text-ink-soft">{title}</p>
      {hint && <p className="mt-1">{hint}</p>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link className="btn" href={hrefFor(page - 1)} rel="prev">
          ← {t("page.prev")}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link className="btn" href={hrefFor(page + 1)} rel="next">
          {t("page.next")} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function EntityCard({ e, extra }: { e: EntitySummary; extra?: React.ReactNode }) {
  return (
    <Link href={`/entities/${e.slug}`} className="card-link flex h-full flex-col gap-2 overflow-hidden" data-testid="entity-card">
      {e.image && (
        // eslint-disable-next-line @next/next/no-img-element -- Wikimedia serves sized thumbnails; no optimizer needed
        <img src={commonsThumb(e.image.url, 500)} alt={e.image.alt} loading="lazy" decoding="async" className={`-mx-4 -mt-4 mb-1 aspect-[16/9] w-[calc(100%+2rem)] max-w-none ${e.entityType === "brand" ? "bg-white object-contain p-4" : "bg-navy-900 object-cover"}`} />
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-gold-soft uppercase">{catName(e.primaryCategory)}</span>
        <StatusBadge status={e.reviewStatus} />
      </div>
      <h3 className="font-serif text-lg leading-snug text-ink">{e.name}</h3>
      {e.placeLabel && <p className="text-xs text-muted">{e.placeLabel}</p>}
      {e.shortDescription && <p className="line-clamp-3 text-sm text-ink-soft">{e.shortDescription}</p>}
      {extra}
    </Link>
  );
}

export function EntityGrid({ items }: { items: EntitySummary[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((e) => (
        <li key={e.slug}>
          <EntityCard e={e} />
        </li>
      ))}
    </ul>
  );
}

const FACT_LABELS: Record<string, string> = {
  "population-estimate": "Population estimate",
  "population-estimates-base-2020": "Population, April 1, 2020 estimates base",
  "land-area": "Land area",
  "water-area": "Water area",
  "street-address": "Street address",
  "scientific-name": "Scientific name",
  league: "League",
  opened: "Opened",
  inception: "Established",
  closed: "Closed / dissolved",
  capacity: "Capacity",
  area: "Area",
  height: "Height",
  floors: "Floors",
  operator: "Operator",
  owner: "Owner",
  headquarters: "Headquarters",
  "founded-by": "Founded by",
  "parent-organization": "Parent organization",
  "heritage-designation": "Heritage designation",
  "nrhp-reference": "NRHP reference number",
  students: "Students",
  employees: "Employees",
  "osm-location-count": "Mapped locations",
  "official-website": "Official website",
  "county-seat": "County seat",
};

const DATE_KEYS = new Set(["opened", "inception", "closed"]);

/** "2005-03-18" -> "Mar 18, 2005"; "2005-03" -> "March 2005"; "2005" stays. */
export function formatPartialDate(v: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDate(v);
  if (/^\d{4}-\d{2}$/.test(v)) return new Intl.DateTimeFormat(getLocale() === "ro" ? "ro-RO" : "en-US", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${v}-01T00:00:00Z`));
  return v;
}

export function factLabel(key: string) {
  return FACT_LABELS[key] ?? humanize(key);
}

export function formatFactValue(f: FactRow): string {
  if (f.valueText !== null && DATE_KEYS.has(f.key)) return formatPartialDate(f.valueText);
  if (f.valueNum !== null) {
    const v = formatNumber(f.valueNum, getLocale());
    return f.unit && f.unit !== "people" ? `${v} ${f.unit}` : v;
  }
  return f.valueText ?? "—";
}

export function FactTable({ facts, sources }: { facts: FactRow[]; sources: { id: string; title: string; url: string }[] }) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  return (
    <div className="overflow-x-auto">
      <table className="table-data" data-testid="fact-table">
        <thead>
          <tr>
            <th scope="col">Fact</th>
            <th scope="col">Value</th>
            <th scope="col">{t("common.asOf")}</th>
            <th scope="col">{t("common.source")}</th>
          </tr>
        </thead>
        <tbody>
          {facts.map((f) => {
            const s = byId.get(f.sourceId);
            return (
              <tr key={f.id}>
                <td className="text-ink-soft">{factLabel(f.key)}</td>
                <td className="font-medium tabular-nums">{formatFactValue(f)}</td>
                <td className="text-xs text-muted">{f.asOfLabel ?? (f.asOf ? formatDate(f.asOf) : f.verifiedAt ? t("entity.verifiedOn", { date: formatDate(f.verifiedAt) }) : "—")}</td>
                <td className="text-xs">
                  {s ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    f.sourceId
                  )}
                  {f.sourceRef && <span className="block text-muted">{f.sourceRef}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SourceList({ sources }: { sources: (SourceRow & { lastCheck?: SourceCheck | null })[] }) {
  return (
    <ul className="flex flex-col gap-3" data-testid="source-list">
      {sources.map((s) => (
        <li key={s.id} className="card p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium">
              {s.title} ↗
            </a>
            <span className="chip">{humanize(s.kind)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {s.publisher}
            {s.datasetVersion ? ` · ${s.datasetVersion}` : ""}
            {s.retrievedAt ? ` · ${t("sources.retrieved")} ${formatDate(s.retrievedAt)}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("sources.license")}: {s.license}
          </p>
          {s.lastCheck && (
            <p className="mt-1 text-xs text-muted">
              {t("sources.lastCheck")}: {formatDate(s.lastCheck.retrievedAt)} · {s.lastCheck.outcome}
              {s.lastCheck.httpStatus ? ` (HTTP ${s.lastCheck.httpStatus})` : ""}
            </p>
          )}
          {s.limitations && <p className="mt-1 text-xs text-muted">{s.limitations}</p>}
        </li>
      ))}
    </ul>
  );
}

export function StatCard({ value, label, testId }: { value: string | number; label: string; testId?: string }) {
  return (
    <div className="card p-4" data-testid={testId}>
      <p className="font-serif text-3xl text-gold tabular-nums">{typeof value === "number" ? formatNumber(value, getLocale()) : value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
