import { SearchX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { SearchField } from '../../components/search/SearchField';
import { EmptyState, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { pluralize } from '../../lib/format';
import { searchAll, type SearchResultKind } from '../../lib/search';

const KIND_LABELS: Record<SearchResultKind, string> = {
  type: 'Place types',
  brand: 'Brands',
  place: 'Places',
};
const KINDS = Object.keys(KIND_LABELS) as SearchResultKind[];

const isKind = (v: string | null): v is SearchResultKind => KINDS.includes(v as SearchResultKind);

/** Phase 1 version: query + result-kind filter. Category/state filters arrive in Phase 5. */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const kindParam = params.get('kind');
  const kind = isKind(kindParam) ? kindParam : null;

  const allResults = searchAll(query);
  const results = kind ? allResults.filter((r) => r.kind === kind) : allResults;

  function setKind(next: SearchResultKind | null) {
    const p = new URLSearchParams(params);
    if (next) p.set('kind', next);
    else p.delete('kind');
    setParams(p);
  }

  return (
    <>
      <Seo
        title={query ? `Search: ${query}` : 'Search'}
        description="Search place types, brands and documented places across the atlas."
      />
      <PageHeader eyebrow="Search" title={query ? `Results for “${query}”` : 'Search the atlas'}>
        <div className="mt-6 max-w-xl">
          <SearchField key={query} variant="hero" />
        </div>
      </PageHeader>

      <div className="container-page py-section">
        {query && allResults.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by result type">
            <button
              type="button"
              aria-pressed={kind === null}
              onClick={() => setKind(null)}
              className={`rounded border px-3 py-1.5 text-small font-medium ${kind === null ? 'border-navy-900 bg-navy-900 text-paper-white' : 'border-line-strong bg-paper-white text-ink hover:border-navy-700'}`}
            >
              All ({allResults.length})
            </button>
            {KINDS.map((k) => {
              const count = allResults.filter((r) => r.kind === k).length;
              if (count === 0) return null;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={`rounded border px-3 py-1.5 text-small font-medium ${kind === k ? 'border-navy-900 bg-navy-900 text-paper-white' : 'border-line-strong bg-paper-white text-ink hover:border-navy-700'}`}
                >
                  {KIND_LABELS[k]} ({count})
                </button>
              );
            })}
            {kind && (
              <button type="button" onClick={() => setKind(null)} className="ml-2 text-small font-semibold text-navy-700 underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {!query ? (
          <p className="text-body text-ink-muted">Enter a place type, brand, place, city or state.</p>
        ) : results.length === 0 ? (
          <EmptyState icon={SearchX} title={`No results for “${query}”`}>
            Try a broader term, check the spelling, or browse <Link to="/types" className="link">place types</Link> and{' '}
            <Link to="/brands" className="link">brands</Link>.
          </EmptyState>
        ) : (
          <>
            <p className="mb-4 text-small text-ink-muted" aria-live="polite">{pluralize(results.length, 'result')}</p>
            <ul className="divide-y divide-line rounded border border-line bg-paper-white">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="p-5">
                  <p className="eyebrow">{r.meta}</p>
                  <Link to={r.href} className="mt-1 block text-h4 font-semibold text-navy-900 hover:underline">{r.title}</Link>
                  <p className="mt-1 text-small text-ink-muted">{r.summary}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
