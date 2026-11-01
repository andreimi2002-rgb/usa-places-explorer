import type { ReactNode } from 'react';
import { getSource } from '../../lib/data-access';
import { formatMonthYear } from '../../lib/format';
import type { SourcedValue } from '../../types';

interface Props<T> {
  label: string;
  fact: SourcedValue<T>;
  render?: (value: T) => ReactNode;
}

/**
 * A labelled fact with a "date · source" caption.
 * Unknown values show "Not yet verified" instead of a guess.
 */
export function SourcedValueDisplay<T>({ label, fact, render }: Props<T>) {
  const source = fact.sourceId ? getSource(fact.sourceId) : undefined;
  const asOf = formatMonthYear(fact.asOf);
  const hasValue = fact.value !== null;

  return (
    <div className="border-t border-line pt-3">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="mt-1">
        {hasValue ? (
          <span className="text-h3 font-semibold text-navy-900">
            {render ? render(fact.value as T) : String(fact.value)}
          </span>
        ) : (
          <span className="text-body italic text-ink-subtle">Not yet verified</span>
        )}
        {hasValue && (asOf || source) && (
          <span className="mt-1 block text-caption text-ink-subtle">
            {fact.note && <>{fact.note} · </>}
            {asOf && <>{asOf}</>}
            {asOf && source && ' · '}
            {source && (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="link">
                {source.publisher}
              </a>
            )}
          </span>
        )}
      </dd>
    </div>
  );
}
