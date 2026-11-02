import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { PlaceCard } from '../../components/cards/cards';
import { categoryColor } from '../../components/maps/category-colors';
import { PlaceBrowser } from '../../components/places/PlaceBrowser';
import { Breadcrumbs, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { SourceList } from '../../components/ui/SourceList';
import { SourcedValueDisplay } from '../../components/ui/SourcedValueDisplay';
import {
  getCategoryBreakdown, getCityBySlug, getLocalityBreakdown, getPlacesByCity, getSources, getStateByCode,
  isBasicListing,
} from '../../lib/data-access';
import { formatNumber, pluralize } from '../../lib/format';
import { NotFoundPage } from '../NotFound/NotFoundPage';

const PlacesMap = lazy(() => import('../../components/maps/PlacesMap'));

const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CityDetailPage() {
  const { slug: citySlug = '' } = useParams();
  const city = getCityBySlug(citySlug);
  if (!city) return <NotFoundPage />;

  const state = getStateByCode(city.stateCode);
  const places = getPlacesByCity(city);
  const profiles = places.filter((p) => !isBasicListing(p));
  const breakdown = getCategoryBreakdown(places);
  const localities = getLocalityBreakdown(places);
  const typeCount = new Set(places.map((p) => p.placeTypeId)).size;
  const mappable = places.filter((p) => p.lat !== null && p.lng !== null).length;

  const stats = [
    { label: 'Places', value: places.length },
    { label: 'In-depth profiles', value: profiles.length },
    { label: 'Cities and towns', value: localities.length },
    { label: 'Place types', value: typeCount },
  ];

  return (
    <>
      <Seo
        title={`${city.areaName}: places to explore`}
        description={`${formatNumber(places.length)} places across ${city.areaName}, ${state?.name}: theme parks, museums, parks, venues and more, each with its sources.`}
      />
      <PageHeader eyebrow={`City area · ${state?.name ?? city.stateCode}`} title={city.areaName} intro={<p>{city.intro}</p>}>
        <div className="mt-6">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Cities', to: '/cities' },
              { label: city.areaName },
            ]}
          />
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-paper p-4">
              <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{s.label}</dt>
              <dd className="mt-1 text-h2 font-semibold text-navy-900">{formatNumber(s.value)}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <section aria-labelledby="map-title" className="container-page pt-section">
        <SectionHeading id="map-title" eyebrow="Map" title={`${city.areaName} on the map`} />
        <Suspense fallback={<div className="h-[420px] animate-pulse rounded border border-line bg-paper-sunk md:h-[520px]" />}>
          <PlacesMap places={places} center={city.center} label={`Map of ${formatNumber(mappable)} places in ${city.areaName}`} />
        </Suspense>
        <ul aria-label="Map legend" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
          {breakdown.map(({ category, count }) => (
            <li key={category.id} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(category.id) }} />
              {category.name} ({count})
            </li>
          ))}
        </ul>
        <p className="mt-2 text-caption text-ink-subtle">
          Larger dots are in-depth profiles. Every place on the map is also in the list below.
        </p>
      </section>

      {profiles.length > 0 && (
        <section aria-labelledby="profiles-title" className="container-page pt-section">
          <SectionHeading id="profiles-title" eyebrow="Read in depth" title={`In-depth profiles in ${city.areaName}`} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => <li key={p.id}><PlaceCard place={p} /></li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="explore-title" className="container-page pt-section">
        <SectionHeading id="explore-title" eyebrow="Explore" title="By category and by town" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-h4">Categories</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {breakdown.map(({ category, count }) => (
                <li key={category.id}>
                  <Link
                    to={`?category=${category.slug}#places-title`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-white px-3 py-1.5 text-small text-ink hover:border-navy-300"
                  >
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(category.id) }} />
                    {category.name}
                    <span className="text-ink-subtle">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-h4">Cities and towns</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {localities.map(({ name, count }) => (
                <li key={name}>
                  <Link
                    to={`?city=${slug(`${name} ${city.stateCode}`)}#places-title`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-white px-3 py-1.5 text-small text-ink hover:border-navy-300"
                  >
                    {name}
                    <span className="text-ink-subtle">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="places-title" className="container-page scroll-mt-24 py-section">
        <SectionHeading id="places-title" eyebrow="Browse" title={`All places in ${city.areaName}`} />
        <PlaceBrowser places={places} filters={['city', 'category', 'type']} />
      </section>

      <section aria-labelledby="about-title" className="container-page pb-section">
        <SectionHeading id="about-title" eyebrow="About this area" title="Facts and sources" />
        <div className="grid gap-10 lg:grid-cols-2">
          <dl className="space-y-3">
            <SourcedValueDisplay label="Population" fact={city.population} />
            <SourcedValueDisplay label="Area" fact={city.areaSqMi} render={(v) => `${formatNumber(v)} sq mi`} />
            <div className="border-t border-line pt-3">
              <dt className="text-small text-ink-muted">Counties</dt>
              <dd className="mt-1 text-body text-ink">{city.countyNames.join(', ')}</dd>
            </div>
          </dl>
          <div>
            <p className="text-small text-ink-muted">
              A place belongs to {city.areaName} when its coordinates fall in one of the {pluralize(city.countyNames.length, 'county', 'counties')} above,
              as reported by the U.S. Census Bureau geocoder. Towns and cities are the official localities from the same source.
            </p>
            <div className="mt-4">
              <SourceList sources={getSources(city.sourceIds)} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
