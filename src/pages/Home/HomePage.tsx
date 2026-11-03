import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import {
  CategoryCard, CityCard, CollectionCard, PlaceCard, StateCard,
} from '../../components/cards/cards';
import { SearchField } from '../../components/search/SearchField';
import { PageHero, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import {
  getCategoriesWithData, getCategoryPlaceCount, getCities, getCollections, getFullProfiles, getImage,
  getLocalityBreakdown, getPlacesByCity, getPlaceTypesByCategory, getSiteCounts, getStates,
} from '../../lib/data-access';
import { formatNumber, pluralize } from '../../lib/format';

/** The home page reads like a magazine cover: one big image, then a few strong sections. */
export function HomePage() {
  const counts = getSiteCounts();
  const states = getStates();
  const cities = getCities();
  const featuredCity = cities[0];
  const collections = getCollections();
  // A hand-picked mix for the cover; falls back to any profile with a photo.
  const picks = ['place-grand-canyon-national-park', 'place-golden-gate-bridge', 'place-walt-disney-world', 'place-wigwam-motel-holbrook'];
  const withPhoto = getFullProfiles().filter((p) => p.imageIds.length > 0);
  const profiles = [
    ...picks.flatMap((id) => withPhoto.filter((p) => p.id === id)),
    ...withPhoto.filter((p) => !picks.includes(p.id)),
  ].slice(0, 4);
  const categories = getCategoriesWithData();
  const hero = getImage('img-grand-canyon-mather-inversion');

  return (
    <>
      <Seo description="An atlas of the places that make up the United States, from travel centers and theme parks to lighthouses, ghost towns and national parks, each with its sources." />

      <PageHero
        size="lg"
        image={hero}
        eyebrow="USA Places Explorer"
        title="Discover every side of America."
        intro={
          <p>
            Theme parks and ghost towns, roadside giants and national parks: {formatNumber(counts.places)} places
            across {states.map((s) => s.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}, each one traced back to its sources.
          </p>
        }
      >
        <div className="mt-8 max-w-xl">
          <SearchField variant="hero" />
        </div>
      </PageHero>

      {featuredCity && (
        <section aria-labelledby="city-title" className="container-page py-section-lg">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <CityCard city={featuredCity} aspect="aspect-[4/3] md:aspect-[16/11]" />
            <div>
              <p className="eyebrow">City in depth</p>
              <h2 id="city-title" className="mt-2 text-h2 md:text-[2.75rem] md:leading-[3.1rem]">
                {featuredCity.areaName}, place by place
              </h2>
              <p className="mt-5 font-serif text-lead text-ink-muted">{featuredCity.intro}</p>
              <p className="mt-5 text-small text-ink-muted">
                {pluralize(getPlacesByCity(featuredCity).length, 'place')} in{' '}
                {pluralize(getLocalityBreakdown(getPlacesByCity(featuredCity)).length, 'city or town', 'cities and towns')}, on one map.
              </p>
              <Link
                to={`/cities/${featuredCity.slug}`}
                className="mt-7 inline-flex items-center gap-2 rounded bg-navy-900 px-5 py-3 text-small font-semibold text-paper-white hover:bg-navy-700"
              >
                Explore {featuredCity.name}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section aria-labelledby="collections-title" className="border-y border-line bg-paper-white py-section-lg">
          <div className="container-page">
            <SectionHeading
              id="collections-title"
              eyebrow="Collections"
              title="Stories told in places"
              intro="Curated trips through the atlas: the roadside, the wild, the Old West and more."
              action={{ label: 'All collections', to: '/collections' }}
            />
            <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {collections.slice(0, 6).map((c) => (
                <li key={c.id}><CollectionCard collection={c} /></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="states-title" className="container-page py-section-lg">
        <SectionHeading id="states-title" eyebrow="By state" title="Four states to start" action={{ label: 'All states', to: '/states' }} />
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.code}><StateCard state={s} /></li>
          ))}
        </ul>
      </section>

      {profiles.length > 0 && (
        <section aria-labelledby="profiles-title" className="container-page pb-section-lg">
          <SectionHeading
            id="profiles-title"
            eyebrow="Read in depth"
            title="Places worth the detour"
            intro="Profiles written for the atlas: what each place is, its story and the facts behind it, every one sourced."
          />
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((p) => (
              <li key={p.id}><PlaceCard place={p} /></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="kinds-title" className="border-t border-line bg-paper-white py-section-lg">
        <div className="container-page">
          <SectionHeading
            id="kinds-title"
            eyebrow="Kinds of places"
            title="What America is made of"
            intro={`${pluralize(counts.placeTypes, 'kind')} of place in ${pluralize(categories.length, 'category', 'categories')}, each explained, from travel centers to theme parks.`}
            action={{ label: 'All place types', to: '/types' }}
          />
          <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <CategoryCard category={c} typeCount={getPlaceTypesByCategory(c.id).length} placeCount={getCategoryPlaceCount(c.id)} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
