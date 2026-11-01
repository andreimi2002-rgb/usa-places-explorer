import { ExternalLink } from 'lucide-react';
import { formatFullDate } from '../../lib/format';
import type { Source, SourceKind } from '../../types';

const KIND_LABELS: Record<SourceKind, string> = {
  official: 'Official',
  government: 'Government',
  wikidata: 'Wikidata',
  wikipedia: 'Wikipedia',
  news: 'News',
  openstreetmap: 'OpenStreetMap',
  other: 'Other',
};

/** Numbered list of sources with publisher, type and the date each was checked. */
export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <ol className="space-y-3">
      {sources.map((s, i) => (
        <li key={s.id} className="flex gap-3 text-small">
          <span className="w-5 shrink-0 text-right font-semibold text-ink-subtle">{i + 1}.</span>
          <div className="min-w-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1 break-words font-medium text-navy-700 hover:underline"
            >
              <span>{s.title}</span>
              <ExternalLink aria-hidden="true" className="mt-1 h-3 w-3 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <p className="text-caption text-ink-subtle">
              {s.publisher} · {KIND_LABELS[s.kind]} · checked {formatFullDate(s.accessed)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
