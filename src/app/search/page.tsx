import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { t } from "@/lib/i18n";
import { param } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t("search.title") };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const SCOPES = [
  { slug: "", label: "Everywhere" },
  { slug: "florida", label: "Florida" },
  { slug: "jacksonville-fl", label: "Jacksonville" },
];

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = param(sp, "q") ?? "";
  const placeRaw = param(sp, "place");
  const place = SCOPES.some((s) => s.slug === placeRaw) ? placeRaw : undefined;
  const hits = q ? await getProvider().search(q, { limit: 50, areaSlug: place }) : [];
  const href = (h: (typeof hits)[number]) => (h.kind === "entity" ? `/entities/${h.slug}` : h.kind === "area" ? `/places/${h.slug}` : `/topics/${h.slug}`);

  return (
    <div className="container-page pt-8">
      <SectionHeading eyebrow="America 360" title={t("search.title")} />
      <form action="/search" method="get" role="search" className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="sr-only" htmlFor="search-q">{t("search.label")}</label>
        <input id="search-q" name="q" type="search" defaultValue={q} className="field" placeholder={t("search.placeholder")} />
        <label className="sr-only" htmlFor="search-place">Scope</label>
        <select id="search-place" name="place" defaultValue={place ?? ""} className="field">
          {SCOPES.map((s) => (
            <option key={s.slug} value={s.slug}>{s.label}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary">{t("search.submit")}</button>
      </form>

      {q && (
        <section className="mt-6" aria-live="polite">
          <p className="mb-3 text-sm text-muted" data-testid="search-count">{t("search.results", { n: hits.length })}</p>
          {hits.length ? (
            <ul className="flex flex-col gap-2" data-testid="search-results">
              {hits.map((h) => (
                <li key={`${h.kind}-${h.slug}`}>
                  <Link href={href(h)} className="card-link flex items-baseline justify-between gap-3 px-4 py-3">
                    <span>
                      <span className="block font-medium">{h.name}</span>
                      <span className="block text-xs text-muted">{h.subtitle}</span>
                    </span>
                    <span className="chip shrink-0">{t(`search.kind.${h.kind}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t("search.noResults")} hint={t("search.noResultsHint")} />
          )}
        </section>
      )}
    </div>
  );
}
