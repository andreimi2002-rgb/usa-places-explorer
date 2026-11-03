import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { ImageAsset } from '../../types';
import { PhotoCredit } from './AtlasImage';

export function PageHeader({
  eyebrow, title, intro, children,
}: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-paper-white">
      <div className="container-page py-12 md:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-hero-sm md:text-[3.25rem] md:leading-[3.5rem]">{title}</h1>
        {intro && <div className="lede mt-5 text-ink-muted">{intro}</div>}
        {children}
      </div>
    </header>
  );
}

/**
 * Full-bleed photo header with the title set over the image. Falls back to a
 * navy band when there is no photo.
 */
export function PageHero({
  image, eyebrow, title, intro, crumbs, children, size = 'md',
}: {
  image: ImageAsset | undefined;
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  size?: 'md' | 'lg';
}) {
  return (
    <header className="relative isolate overflow-hidden bg-navy-900 text-paper-white">
      {image && (
        <img
          src={image.fileUrl}
          alt={image.alt}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className="hero-scrim absolute inset-0 -z-10" />
      <div
        className={`container-page flex flex-col justify-end pb-10 md:pb-14 ${
          !image ? 'pt-14 md:pt-20' : size === 'lg' ? 'min-h-[min(80vh,760px)] pt-32' : 'min-h-[min(55vh,520px)] pt-28 md:min-h-[min(62vh,600px)]'
        }`}
      >
        {crumbs && <Breadcrumbs items={crumbs} tone="light" />}
        {eyebrow && <p className="mt-6 text-eyebrow font-semibold uppercase text-gold">{eyebrow}</p>}
        <h1 className="mt-3 max-w-4xl text-hero-sm text-paper-white md:text-hero">{title}</h1>
        {intro && <div className="mt-5 max-w-2xl font-serif text-lead text-paper-white/90 md:text-[1.375rem] md:leading-[2rem]">{intro}</div>}
        {children}
      </div>
      {image && <PhotoCredit image={image} className="bottom-3 right-3" />}
    </header>
  );
}

export function SectionHeading({
  id, title, eyebrow, action, intro,
}: { id?: string; title: string; eyebrow?: string; action?: { label: string; to: string }; intro?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-h2 md:text-[2.375rem] md:leading-[2.75rem]">{title}</h2>
        {intro && <div className="mt-3 font-serif text-lead text-ink-muted">{intro}</div>}
      </div>
      {action && (
        <Link to={action.to} className="inline-flex items-center gap-1 text-small font-semibold text-navy-700 hover:underline">
          {action.label}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, children,
}: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded border border-dashed border-line-strong bg-paper-white px-6 py-12 text-center">
      <Icon aria-hidden="true" className="h-7 w-7 text-navy-300" />
      <p className="mt-3 text-h4 font-semibold text-navy-900">{title}</p>
      {children && <div className="mt-2 max-w-prose text-small text-ink-muted">{children}</div>}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, tone = 'dark' }: { items: Crumb[]; tone?: 'dark' | 'light' }) {
  const base = tone === 'light' ? 'text-paper-white/80' : 'text-ink-muted';
  const current = tone === 'light' ? 'text-paper-white' : 'text-ink';
  const hover = tone === 'light' ? 'hover:text-paper-white' : 'hover:text-navy-700';
  return (
    <nav aria-label="Breadcrumb" className={`text-small ${base}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 opacity-70" />}
            {item.to ? (
              <Link to={item.to} className={`${hover} hover:underline`}>{item.label}</Link>
            ) : (
              <span aria-current="page" className={current}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A titled block inside a long-form article. */
export function ArticleSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="text-h2">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A row of headline numbers under a page hero. Values are computed from the data. */
export function StatsBand({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="border-b border-line bg-paper-white">
      <dl className="container-page grid grid-cols-2 gap-y-5 py-6 sm:flex sm:gap-10">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{s.label}</dt>
            <dd className="mt-1 font-serif text-h2 font-semibold text-navy-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
