import { useParams } from 'react-router';
import { CollectionCard, PlaceCard } from '../../components/cards/cards';
import { Breadcrumbs, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import {
  getCollectionBySlug, getCollectionPlaces, getCollections, getStateByCode,
} from '../../lib/data-access';
import { pluralize } from '../../lib/format';
import { NotFoundPage } from '../NotFound/NotFoundPage';

export function CollectionDetailPage() {
  const { slug = '' } = useParams();
  const collection = getCollectionBySlug(slug);
  if (!collection) return <NotFoundPage />;

  const places = getCollectionPlaces(collection);
  const states = [...new Set(places.map((p) => p.stateCode))]
    .map((code) => getStateByCode(code)?.name ?? code)
    .sort();
  const others = getCollections().filter((c) => c.id !== collection.id).slice(0, 3);

  return (
    <>
      <Seo title={collection.name} description={collection.intro} />
      <PageHeader eyebrow="Collection" title={collection.name} intro={<p>{collection.intro}</p>}>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Breadcrumbs items={[{ label: 'Collections', to: '/collections' }, { label: collection.name }]} />
          <p className="text-small text-ink-muted">
            {pluralize(places.length, 'place')} in {states.join(', ')}
          </p>
        </div>
      </PageHeader>

      <section aria-labelledby="stops-title" className="container-page py-section">
        <SectionHeading id="stops-title" eyebrow="In this collection" title="The places" />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p) => {
            const note = collection.notes?.[p.id];
            return (
              <li key={p.id} className="flex flex-col gap-3">
                <PlaceCard place={p} />
                {note && <p className="px-1 font-serif text-body text-ink-muted">{note}</p>}
              </li>
            );
          })}
        </ol>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="more-title" className="container-page pb-section">
          <SectionHeading id="more-title" eyebrow="Keep exploring" title="More collections" action={{ label: 'All collections', to: '/collections' }} />
          <ul className="grid gap-6 md:grid-cols-3">
            {others.map((c) => <li key={c.id}><CollectionCard collection={c} /></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
