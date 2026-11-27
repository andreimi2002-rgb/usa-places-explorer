import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, EntityGrid, Pagination } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { REVIEW_STATUSES } from "@/lib/data/types";
import type { ReviewStatus } from "@/lib/domain/schemas";
import { catName, t } from "@/lib/i18n";
import { pageParam, param, withQuery } from "@/lib/url";
import { PlaceHeader, loadArea } from "../shared";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await getProvider().getArea(slug);
  return { title: area ? `${area.name} — ${t("area.directory")}` : t("common.notFound") };
}

export default async function DirectoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const area = await loadArea(slug);
  const db = getProvider();
  const topic = param(sp, "topic");
  const q = param(sp, "q");
  const statusRaw = param(sp, "status");
  const status = REVIEW_STATUSES.includes(statusRaw as ReviewStatus) ? (statusRaw as ReviewStatus) : undefined;
  const page = pageParam(sp);
  const pageSize = 12;

  const [tree, result] = await Promise.all([
    db.getCategoryTree(area.slug),
    db.listEntities({ areaSlug: area.slug, categorySlug: topic, q, reviewStatus: status, page, pageSize, sort: "featured" }),
  ]);
  const base = `/places/${area.slug}/directory`;
  const href = (p: number) => withQuery(base, { topic, q, status, page: p });
  const selected = topic ? findNode(tree, topic) : null;
  const from = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const to = Math.min(result.page * result.pageSize, result.total);

  return (
    <>
      <PlaceHeader area={area} tab="directory" />
      <div className="container-page mt-6">
        <form action={base} method="get" className="card grid gap-3 p-4 sm:grid-cols-[2fr_1.4fr_1fr_auto]" role="search" aria-label={t("dir.title")}>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t("nav.search")}
            <input name="q" type="search" defaultValue={q} className="field" placeholder={t("search.placeholder")} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t("nav.topics")}
            <select name="topic" defaultValue={topic ?? ""} className="field">
              <option value="">{t("dir.allTopics")}</option>
              {tree.map((d) => (
                <optgroup key={d.slug} label={`${catName(d)} (${d.entityCount})`}>
                  <option value={d.slug}>{catName(d)} — all</option>
                  {d.children.filter((c) => c.entityCount > 0).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {catName(c)} ({c.entityCount})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Status
            <select name="status" defaultValue={status ?? ""} className="field">
              <option value="">{t("dir.allStatuses")}</option>
              {REVIEW_STATUSES.filter((s) => s !== "rejected").map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary">
              {t("dir.filter")}
            </button>
            <Link href={base} className="btn">
              {t("dir.reset")}
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Domains">
          {tree.filter((d) => d.entityCount > 0).map((d) => (
            <Link key={d.slug} href={withQuery(base, { topic: d.slug, q, status })} className={`chip no-underline hover:no-underline ${topic === d.slug ? "border-gold text-gold" : "hover:border-gold-soft"}`} aria-current={topic === d.slug ? "true" : undefined}>
              {catName(d)} <span className="text-muted">{d.entityCount}</span>
            </Link>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted" role="status" data-testid="result-count">
          {result.total ? t("dir.showing", { from, to, total: result.total }) : null}
          {selected ? ` · ${catName(selected)}` : ""}
        </p>

        <div className="mt-3">
          {result.items.length ? <EntityGrid items={result.items} /> : <EmptyState title={t("dir.empty")} hint={t("dir.emptyHint")} />}
        </div>
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={href} />
      </div>
    </>
  );
}

function findNode<T extends { slug: string; children: T[] }>(nodes: T[], slug: string): T | null {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const f = findNode(n.children, slug);
    if (f) return f;
  }
  return null;
}
