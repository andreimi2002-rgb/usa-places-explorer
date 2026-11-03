import { Link, useParams } from 'react-router';
import { categoryColor } from '../../components/maps/category-colors';
import { AtlasImage } from '../../components/ui/AtlasImage';
import { CollectionCard, getCollectionCover } from '../../components/cards/cards';
import { PageHero, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import {
  getCategoryForPlace, getCollectionBySlug, getCollectionPlaces, getCollections, getImage, getPlaceTypeById,
  getStateByCode,
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
      <PageHero
        image={getCollectionCover(collection)}
        crumbs={[{ label: 'Collections', to: '/collections' }, { label: collection.name }]}
        eyebrow={`Collection · ${pluralize(places.length, 'place')} in ${states.join(', ')}`}
        title={collection.name}
        intro={<p>{collection.intro}</p>}
      />

      <section aria-labelledby="stops-title" className="container-page py-section">
        <SectionHeading id="stops-title" eyebrow="In this collection" title="The places" />
        <ol className="space-y-16 md:space-y-20">
          {places.map((p, i) => {
            const note = collection.notes?.[p.id];
            const type = getPlaceTypeById(p.placeTypeId);
            const state = getStateByCode(p.stateCode);
            const img = p.imageIds[0] ? getImage(p.imageIds[0]) : undefined;
            const category = getCategoryForPlace(p);
            return (
              <li key={p.id} className="group relative grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <div className={`overflow-hidden rounded-md ${i % 2 ? 'md:order-2' : ''}`}>
                  <AtlasImage
                    image={img}
                    aspect="aspect-[4/3]"
                    imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                    fallback={<div className="aspect-[4/3] w-full" style={{ backgroundColor: categoryColor(category?.id) }} />}
                  />
                </div>
                <div>
                  <p className="font-serif text-[3.5rem] font-semibold leading-none text-gold">{String(i + 1).padStart(2, '0')}</p>
                  <p className="eyebrow mt-4">{[type?.name, [p.city, state?.name].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p>
                  <h3 className="mt-2 font-serif text-h2 font-semibold text-navy-900">
                    <Link to={`/places/${p.slug}`} className="decoration-gold decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:underline">
                      {p.name}
                    </Link>
                  </h3>
                  <p className="mt-3 font-serif text-lead text-ink-muted">{note ?? p.summary}</p>
                </div>
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
