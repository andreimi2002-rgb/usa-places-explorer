import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { EmptyState, EntityGrid, Pagination, SectionHeading } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { catName, t } from "@/lib/i18n";
import { pageParam, param, withQuery } from "@/lib/url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const SCOPES = [
  { slug: "", label: "All geography" },
  { slug: "florida", label: "Florida" },
  { slug: "duval-county-fl", label: "Duval County" },
  { slug: "jacksonville-fl", label: "Jacksonville" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getProvider().getCategory(slug);
  return { title: c ? catName(c) : t("common.notFound") };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const db = getProvider();
  const cat = await db.getCategory(slug);
  if (!cat) {
    const target = await db.resolveRedirect("category", slug);
    if (target) permanentRedirect(`/topics/${target}`);
    notFound();
  }
  const place = param(sp, "place");
  const scope = SCOPES.some((s) => s.slug === place) ? place : undefined;
  const page = pageParam(sp);
  const entities = await db.listEntities({ categorySlug: slug, areaSlug: scope, page, pageSize: 12 });
  const base = `/topics/${slug}`;

  return (
    <div className="container-page pt-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/topics" className="text-muted">{t("topics.title")}</Link></li>
          {cat.path.map((p, i) => (
            <li key={p.slug} className="flex gap-1.5">
              <span aria-hidden="true">›</span>
              {i === cat.path.length - 1 ? <span aria-current="page" className="text-ink">{catName(p)}</span> : <Link href={`/topics/${p.slug}`} className="text-muted">{catName(p)}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <SectionHeading eyebrow={`Domain ${String(cat.domainNumber).padStart(2, "0")}`} title={catName(cat)} />
      {cat.description && <p className="prose-note -mt-2 mb-4 max-w-3xl">{cat.description}</p>}

      {cat.children.length > 0 && (
        <section className="mb-8" aria-labelledby="subcats">
          <h2 id="subcats" className="panel-title">{t("topics.subcategories")}</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {cat.children.map((c) => (
              <li key={c.slug}>
                <Link href={`/topics/${c.slug}`} className="card-link block px-3 py-2">
                  <span className="block text-sm">{catName(c)}</span>
                  <span className={`text-[11px] ${c.entityCount ? "text-mint" : "text-muted"}`}>{c.entityCount || t("topics.empty")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="entries">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="entries" className="panel-title mb-0">{t("topics.entries")} <span className="text-sm text-muted">({entities.total})</span></h2>
          <nav aria-label="Geographic scope" className="flex flex-wrap gap-1.5">
            {SCOPES.map((s) => (
              <Link key={s.slug || "all"} href={withQuery(base, { place: s.slug })} className={`chip no-underline hover:no-underline ${(scope ?? "") === s.slug ? "border-gold text-gold" : ""}`} aria-current={(scope ?? "") === s.slug ? "true" : undefined}>
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
        {entities.items.length ? <EntityGrid items={entities.items} /> : <EmptyState title={t("topics.empty")} hint={t("dir.emptyHint")} />}
        <Pagination page={entities.page} pageSize={entities.pageSize} total={entities.total} hrefFor={(p) => withQuery(base, { place: scope, page: p })} />
      </section>
    </div>
  );
}
