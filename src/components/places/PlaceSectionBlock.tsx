import type { PlaceSectionDefinition } from '../../config/place-sections';
import { getSource } from '../../lib/data-access';
import { formatMonthYear } from '../../lib/format';
import type { PlaceSection, SectionFact } from '../../types';

function FactRow({ fact }: { fact: SectionFact }) {
  const source = fact.sourceId ? getSource(fact.sourceId) : undefined;
  const asOf = formatMonthYear(fact.asOf);
  return (
    <div className="grid gap-1 border-t border-line py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
      <dt className="text-small font-semibold text-ink-muted">{fact.label}</dt>
      <dd>
        <span className="text-body text-ink">{fact.value}</span>
        {(asOf || source) && (
          <span className="mt-0.5 block text-caption text-ink-subtle">
            {asOf}
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

/**
 * One type-specific block on a place page (e.g. "Fuel", "Parks", "What it handles").
 * Titles and icons come from the section config, never from the place type name.
 */
export function PlaceSectionBlock({
  id, definition, section,
}: { id: string; definition: PlaceSectionDefinition; section: PlaceSection }) {
  const Icon = definition.icon;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-2 text-h3">
        <Icon aria-hidden="true" className="h-5 w-5 text-gold-ink" />
        {definition.title}
      </h2>
      <div className="mt-4 space-y-4">
        {section.body && <p className="prose-atlas">{section.body}</p>}
        {section.items && section.items.length > 0 && (
          <ul className="max-w-prose list-disc space-y-1.5 pl-5 font-serif text-body text-ink marker:text-gold">
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
        {section.facts && section.facts.length > 0 && (
          <dl className="rounded border border-line bg-paper-white px-4 [&>div:first-child]:border-t-0">
            {section.facts.map((f) => <FactRow key={f.label} fact={f} />)}
          </dl>
        )}
      </div>
    </section>
  );
}
