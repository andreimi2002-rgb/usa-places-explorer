import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { catName, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t("topics.title") };

export default async function TopicsPage() {
  const tree = await getProvider().getCategoryTree();
  return (
    <div className="container-page pt-8">
      <SectionHeading eyebrow="Encyclopedia" title={t("topics.title")} />
      <p className="prose-note -mt-2 mb-6 max-w-3xl">{t("topics.lede")}</p>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="domain-list">
        {tree.map((d) => (
          <li key={d.slug} className="card flex flex-col p-4">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/topics/${d.slug}`} className="font-serif text-lg text-ink">
                <span className="mr-2 text-sm text-muted tabular-nums">{String(d.domainNumber).padStart(2, "0")}</span>
                {catName(d)}
              </Link>
              <span className={`text-xs ${d.entityCount ? "text-mint" : "text-muted"}`}>{d.entityCount || t("topics.empty")}</span>
            </div>
            {d.description && <p className="mt-1 text-xs text-muted">{d.description}</p>}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {d.children.map((c) => (
                <li key={c.slug}>
                  <Link href={`/topics/${c.slug}`} className={`chip no-underline hover:border-gold-soft hover:no-underline ${c.entityCount ? "" : "opacity-60"}`}>
                    {catName(c)}
                    {c.entityCount > 0 && <span className="text-mint">{c.entityCount}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
