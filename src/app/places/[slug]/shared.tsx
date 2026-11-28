import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs, StatusBadge } from "@/components/ui";
import { getProvider } from "@/lib/data";
import type { AreaDetail } from "@/lib/data/types";
import { t } from "@/lib/i18n";

export const loadArea = cache(async (slug: string): Promise<AreaDetail> => {
  const db = getProvider();
  const area = await db.getArea(slug);
  if (area) return area;
  const target = await db.resolveRedirect("area", slug);
  if (target) permanentRedirect(`/places/${target}`);
  notFound();
});

export function areaKicker(a: AreaDetail): string {
  const parts = [a.typeLabel ?? a.areaType, ...a.breadcrumbs.slice(1).map((c) => c.name)];
  return parts.join(" · ");
}

type Tab = "overview" | "directory" | "localities";

export function PlaceHeader({ area, tab }: { area: AreaDetail; tab: Tab }) {
  const photo = area.media.find((m) => m.kind === "photo" && !m.aiGenerated);
  const showLocalities = ["country", "state", "county", "municipality"].includes(area.areaType);
  const showDirectory = area.entityCount > 0 || area.programStatus === "active";
  const tabs: { id: Tab; href: string; label: string }[] = [
    { id: "overview", href: `/places/${area.slug}`, label: t("area.overview") },
    ...(showDirectory ? [{ id: "directory" as Tab, href: `/places/${area.slug}/directory`, label: `${t("area.directory")} (${area.entityCount})` }] : []),
    ...(showLocalities ? [{ id: "localities" as Tab, href: `/places/${area.slug}/localities`, label: t("area.localities") }] : []),
  ];
  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={area.breadcrumbs} current={area.name} />
      <section
        className="relative overflow-hidden rounded-[20px] border border-line bg-[linear-gradient(120deg,#0f1d2b_0%,#132433_55%,#16303b_100%)]"
        aria-labelledby="place-title"
      >
        {photo && (
          <>
            <Image src={photo.url} alt={photo.alt} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover object-[center_55%] opacity-45" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#070f18_0%,#070f18cc_40%,#070f1830_100%)]" />
          </>
        )}
        <div className="relative px-5 py-8 sm:px-8 sm:py-12">
          <p className="eyebrow">{areaKicker(area)}</p>
          <h1 id="place-title" className="mt-3 text-4xl sm:text-6xl">
            {area.name}
            <span className="text-gold">.</span>
          </h1>
          {area.officialName && area.officialName !== area.name && <p className="mt-2 text-sm text-ink-soft">Official name: {area.officialName}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={area.reviewStatus} />
            {area.programStatus === "active" ? (
              <span className="chip border-gold/60 text-gold">Active coverage</span>
            ) : (
              <span className="chip">Registry only</span>
            )}
          </div>
        </div>
        {photo && (
          <p className="absolute right-2 bottom-2 rounded bg-navy-950/80 px-2 py-1 text-[10px] text-ink-soft">
            Photo:{" "}
            <a href={photo.pageUrl} target="_blank" rel="noopener noreferrer">
              {photo.credit}
              {photo.year ? ` (${photo.year})` : ""}
            </a>{" "}
            ·{" "}
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">
              {photo.license}
            </a>
          </p>
        )}
      </section>
      {tabs.length > 1 && (
        <nav aria-label="Place sections" className="mt-4 border-b border-line">
          <ul className="flex gap-1 overflow-x-auto">
            {tabs.map((x) => (
              <li key={x.id}>
                <Link
                  href={x.href}
                  aria-current={x.id === tab ? "page" : undefined}
                  className={`inline-block border-b-2 px-3 py-2 text-sm no-underline hover:no-underline ${x.id === tab ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink"}`}
                >
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
