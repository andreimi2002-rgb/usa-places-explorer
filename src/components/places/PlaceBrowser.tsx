import { MapPin } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  getCategoryById, getPlaceTypeById, getStateByCode, isBasicListing,
} from '../../lib/data-access';
import { formatNumber, pluralize } from '../../lib/format';
import type { Place } from '../../types';
import { PlaceCard } from '../cards/cards';
import { EmptyState } from '../ui/layout-primitives';

export type PlaceFilter = 'state' | 'category' | 'type';

interface Option {
  value: string;
  label: string;
  count: number;
}

const ALL = '';

function optionsFor(places: Place[], key: (p: Place) => { value: string; label: string } | null): Option[] {
  const map = new Map<string, Option>();
  for (const p of places) {
    const k = key(p);
    if (!k) continue;
    const o = map.get(k.value) ?? { ...k, count: 0 };
    o.count++;
    map.set(k.value, o);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

const keys: Record<PlaceFilter, (p: Place) => { value: string; label: string } | null> = {
  state: (p) => {
    const s = getStateByCode(p.stateCode);
    return s ? { value: s.code.toLowerCase(), label: s.name } : null;
  },
  type: (p) => {
    const t = getPlaceTypeById(p.placeTypeId);
    return t ? { value: t.slug, label: t.name } : null;
  },
  category: (p) => {
    const t = getPlaceTypeById(p.placeTypeId);
    const c = t ? getCategoryById(t.categoryId) : undefined;
    return c ? { value: c.slug, label: c.name } : null;
  },
};

const filterLabels: Record<PlaceFilter, string> = { state: 'State', category: 'Category', type: 'Place type' };
const allLabels: Record<PlaceFilter, string> = { state: 'All states', category: 'All categories', type: 'All types' };

/**
 * A filterable, paged grid of places. Filters live in the URL
 * (?state=tx&type=lighthouse&profiles=full) so a filtered view can be shared.
 */
export function PlaceBrowser({
  places, filters, pageSize = 24,
}: { places: Place[]; filters: PlaceFilter[]; pageSize?: number }) {
  const [params, setParams] = useSearchParams();
  const baseId = useId();
  const [pages, setPages] = useState(1);

  const options = useMemo(
    () => Object.fromEntries(filters.map((f) => [f, optionsFor(places, keys[f])])) as Record<PlaceFilter, Option[]>,
    [places, filters],
  );

  // Ignore values that are not valid options for this list.
  const active = Object.fromEntries(
    filters.map((f) => {
      const v = params.get(f) ?? ALL;
      return [f, options[f].some((o) => o.value === v) ? v : ALL];
    }),
  ) as Record<PlaceFilter, string>;
  const fullOnly = params.get('profiles') === 'full';

  const filtered = places.filter(
    (p) =>
      filters.every((f) => active[f] === ALL || keys[f](p)?.value === active[f]) &&
      (!fullOnly || !isBasicListing(p)),
  );
  const shown = filtered.slice(0, pages * pageSize);
  const fullCount = places.filter((p) => !isBasicListing(p)).length;

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true, preventScrollReset: true });
    setPages(1);
  };

  const anyFilter = filters.some((f) => active[f] !== ALL) || fullOnly;

  return (
    <div>
      <div className="flex flex-col gap-4 rounded border border-line bg-paper-white p-4 md:flex-row md:flex-wrap md:items-end">
        {filters.map((f) =>
          options[f].length > 1 ? (
            <div key={f} className="flex min-w-0 flex-col gap-1 md:w-56">
              <label htmlFor={`${baseId}-${f}`} className="text-caption font-semibold uppercase tracking-wider text-ink-muted">
                {filterLabels[f]}
              </label>
              <select
                id={`${baseId}-${f}`}
                value={active[f]}
                onChange={(e) => update(f, e.target.value)}
                className="h-10 w-full rounded border border-line-strong bg-paper-white px-3 text-small text-ink"
              >
                <option value={ALL}>{allLabels[f]}</option>
                {options[f].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({formatNumber(o.count)})
                  </option>
                ))}
              </select>
            </div>
          ) : null,
        )}
        {fullCount > 0 && fullCount < places.length && (
          <label className="flex h-10 items-center gap-2 text-small text-ink">
            <input
              type="checkbox"
              checked={fullOnly}
              onChange={(e) => update('profiles', e.target.checked ? 'full' : '')}
              className="h-4 w-4 accent-navy-700"
            />
            In-depth profiles only ({formatNumber(fullCount)})
          </label>
        )}
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params);
              [...filters, 'profiles'].forEach((f) => next.delete(f));
              setParams(next, { replace: true, preventScrollReset: true });
              setPages(1);
            }}
            className="h-10 text-small font-semibold text-navy-700 hover:underline md:ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-4 text-small text-ink-muted">
        {filtered.length === 0
          ? 'No places match these filters.'
          : `Showing ${formatNumber(shown.length)} of ${pluralize(filtered.length, 'place')}`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={MapPin} title="Nothing here yet">
            Try another filter, or clear them to see everything.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => <li key={p.id}><PlaceCard place={p} /></li>)}
        </ul>
      )}

      {shown.length < filtered.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setPages((n) => n + 1)}
            className="rounded border border-navy-700 px-5 py-2.5 text-small font-semibold text-navy-700 hover:bg-navy-700 hover:text-paper-white"
          >
            Show {formatNumber(Math.min(pageSize, filtered.length - shown.length))} more
          </button>
        </div>
      )}
    </div>
  );
}
