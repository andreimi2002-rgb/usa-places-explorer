import { MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { BrandCard, CityCard, CollectionCard } from '../../components/cards/cards';
import { PlaceBrowser } from '../../components/places/PlaceBrowser';
import { Breadcrumbs, EmptyState, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { categoryIcons } from '../../components/ui/icons';
import {
  getBrandsInState, getCategoryBreakdown, getCitiesByState, getCollectionPlaces, getCollections, getPlacesByState,
  getStateBySlug, isBasicListing,
} from '../../lib/data-access';
import { formatNumber, pluralize } from '../../lib/format';
import { NotFoundPage } from '../NotFound/NotFoundPage';

export function StateDetailPage() {
  const { slug = '' } = useParams();
  const state = getStateBySlug(slug);
  if (!state) return <NotFoundPage />;

  const places = getPlacesByState(state.code);
  const breakdown = getCategoryBreakdown(places);
  const brands = getBrandsInState(state.code);
  const cities = getCitiesByState(state.code);
  const collections = getCollections().filter((c) => getCollectionPlaces(c).some((p) => p.stateCode === state.code));
  const fullCount = places.filter((p) => !isBasicListing(p)).length;
  const typeCount = new Set(places.map((p) => p.placeTypeId)).size;
  const max = breakdown[0]?.count ?? 1;

  const stats = [
    { label: 'Places', value: places.length },
    { label: 'In-depth profiles', value: fullCount },
    { label: 'Place types', value: typeCount },
    { label: 'Categories', value: breakdown.length },
  ];

  return (
    <>
      <Seo
        title={`Places in ${state.name}`}
        description={`${formatNumber(places.length)} documented places in ${state.name}, from ${breakdown.slice(0, 3).map((b) => b.category.name.toLowerCase()).join(', ')} and more. ${state.intro}`}
      />
      <PageHeader eyebrow={`State · ${state.code}`} title={state.name} intro={<p>{state.intro}</p>}>
        <div className="mt-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'States', to: '/states' }, { label: state.name }]} />
        </div>
        {places.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-paper p-4">
                <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{s.label}</dt>
                <dd className="mt-1 text-h2 font-semibold text-navy-900">{formatNumber(s.value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHeader>

      {places.length === 0 ? (
        <div className="container-page py-section">
          <EmptyState icon={MapPin} title="No places published yet">
            Places in {state.name} are being researched and will appear here once verified.
          </EmptyState>
        </div>
      ) : (
        <>
          <section aria-labelledby="breakdown-title" className="container-page pt-section">
            <SectionHeading id="breakdown-title" eyebrow="By category" title={`What ${state.name} has in the atlas`} />
            <ul className="grid gap-x-10 gap-y-3 md:grid-cols-2">
              {breakdown.map(({ category, count }) => {
                const Icon = categoryIcons[category.icon];
                return (
                  <li key={category.id}>
                    <Link
                      to={`/categories/${category.slug}?state=${state.code.toLowerCase()}`}
                      className="group flex items-center gap-3 rounded p-1 hover:bg-paper-white"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-navy-700" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3 text-small">
                          <span className="font-semibold text-navy-900 group-hover:underline">{category.name}</span>
                          <span className="shrink-0 text-ink-muted">{pluralize(count, 'place')}</span>
                        </span>
                        <span aria-hidden="true" className="mt-1 block h-1.5 rounded-full bg-paper-sunk">
                          <span className="block h-full rounded-full bg-navy-500" style={{ width: `${Math.max(4, (count / max) * 100)}%` }} />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {cities.length > 0 && (
            <section aria-labelledby="cities-title" className="container-page pt-section">
              <SectionHeading id="cities-title" eyebrow="In depth" title={`Cities covered in depth in ${state.name}`} />
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => <li key={c.id}><CityCard city={c} /></li>)}
              </ul>
            </section>
          )}

          <section aria-labelledby="places-title" className="container-page py-section">
            <SectionHeading id="places-title" eyebrow="Browse" title={`All places in ${state.name}`} />
            <PlaceBrowser places={places} filters={['area', 'city', 'category', 'type']} />
          </section>

          {brands.length > 0 && (
            <section aria-labelledby="brands-title" className="container-page pb-section">
              <SectionHeading id="brands-title" eyebrow="Brands" title={`Brands with places in ${state.name}`} />
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((b) => <li key={b.id}><BrandCard brand={b} /></li>)}
              </ul>
            </section>
          )}

          {collections.length > 0 && (
            <section aria-labelledby="collections-title" className="container-page pb-section">
              <SectionHeading id="collections-title" eyebrow="Collections" title={`Collections with stops in ${state.name}`} />
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((c) => <li key={c.id}><CollectionCard collection={c} /></li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
