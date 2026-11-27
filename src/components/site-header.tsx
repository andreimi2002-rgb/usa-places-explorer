import Link from "next/link";
import { t } from "@/lib/i18n";
import type { DataMode } from "@/lib/data/types";
import { SearchBox } from "./search-box";

const NAV = [
  { href: "/places/united-states", key: "nav.atlas" },
  { href: "/topics", key: "nav.topics" },
  { href: "/coverage", key: "nav.coverage" },
  { href: "/sources", key: "nav.sources" },
] as const;

export function SiteHeader({ mode }: { mode: DataMode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/90 backdrop-blur">
      <div className="container-page flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 py-2">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-ink no-underline hover:no-underline" aria-label="America 360 home">
          America <span className="text-gold">360</span>
        </Link>
        <nav aria-label="Primary" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex gap-1 overflow-x-auto text-sm sm:gap-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="inline-block rounded-md px-2.5 py-1.5 text-ink-soft no-underline hover:bg-navy-800 hover:text-ink hover:no-underline">
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:max-w-md">
          <SearchBox placeholder={t("search.placeholder")} label={t("search.label")} submitLabel={t("search.submit")} />
          <span
            className={`chip hidden shrink-0 md:inline-flex ${mode === "database" ? "border-mint/50 text-mint" : "border-gold-soft/60 text-gold"}`}
            title={t(mode === "database" ? "mode.database.title" : "mode.fixture.title")}
            data-testid="data-mode"
          >
            {t(mode === "database" ? "mode.database" : "mode.fixture")}
          </span>
        </div>
      </div>
    </header>
  );
}
