import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function PageHeader({
  eyebrow, title, intro, children,
}: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-paper-white">
      <div className="container-page py-10 md:py-14">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-h2 md:text-h1">{title}</h1>
        {intro && <div className="prose-atlas mt-4 text-ink-muted">{intro}</div>}
        {children}
      </div>
    </header>
  );
}

export function SectionHeading({
  id, title, eyebrow, action,
}: { id?: string; title: string; eyebrow?: string; action?: { label: string; to: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-h3 md:text-h2">{title}</h2>
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

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-small text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-ink-subtle" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-navy-700 hover:underline">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
