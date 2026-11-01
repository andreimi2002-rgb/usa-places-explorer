import type { ReactNode } from 'react';
import { getSource } from '../../lib/data-access';
import { formatMonthYear, formatNumber } from '../../lib/format';
import type { SourcedValue } from '../../types';

interface Props<T> {
  label: string;
  fact: SourcedValue<T>;
  /** Custom rendering, e.g. a year that must not get a thousands separator. */
  render?: (value: T) => ReactNode;
}

function defaultRender(value: unknown, approximate: SourcedValue<unknown>['approximate']): ReactNode {
  const text = typeof value === 'number' ? formatNumber(value) : String(value);
  if (approximate === 'more-than') return `${text}+`;
  if (approximate === 'nearly') return `Nearly ${text}`;
  return text;
}

/**
 * A labelled fact with a "note · date · source" caption.
 * Unknown values show "Not yet verified" instead of a guess.
 */
export function SourcedValueDisplay<T>({ label, fact, render }: Props<T>) {
  const source = fact.sourceId ? getSource(fact.sourceId) : undefined;
  const asOf = formatMonthYear(fact.asOf);
  const value = fact.value;

  return (
    <div className="border-t border-line pt-3">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="mt-1">
        {value !== null ? (
          <>
            <span className="block text-h4 font-semibold text-navy-900">
              {render ? render(value) : defaultRender(value, fact.approximate)}
            </span>
            {(fact.note || asOf || source) && (
              <span className="mt-1 block text-caption text-ink-subtle">
                {[fact.note, asOf].filter(Boolean).join(' · ')}
                {source && (
                  <>
                    {(fact.note || asOf) && ' · '}
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="link">
                      {source.publisher}
                    </a>
                  </>
                )}
              </span>
            )}
          </>
        ) : (
          <span className="text-body italic text-ink-subtle">Not yet verified</span>
        )}
      </dd>
    </div>
  );
}
