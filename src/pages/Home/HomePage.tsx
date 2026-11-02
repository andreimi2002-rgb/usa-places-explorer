import { Building2, Layers, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import {
  BrandCard, CategoryCard, CityCard, CollectionCard, PlaceCard, PlaceTypeCard, StateCard,
} from '../../components/cards/cards';
import { SearchField } from '../../components/search/SearchField';
import { SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import {
  getCategoriesWithData, getCategoryPlaceCount, getCities, getCollections, getFeaturedBrand, getFeaturedPlaceType,
  getFullProfiles, getPlaces, getPlaceTypesByCategory, getRecentlyAdded, getSiteCounts, getStates,
  isBasicListing,
} from '../../lib/data-access';
import { formatNumber } from '../../lib/format';

const layers = [
  {
    icon: Layers,
    title: 'Place types',
    text: 'What is a travel center, and how is it different from a truck stop? Type pages explain the kinds of places America is built from.',
    to: '/types',
    cta: 'Browse place types',
  },
  {
    icon: Building2,
    title: 'Brands',
    text: 'Some chains become landmarks in their own right. Brand pages explain what makes them distinctive, with sourced key facts.',
    to: '/brands',
    cta: 'Browse brands',
  },
  {
    icon: MapPin,
    title: 'Places',
    text: 'Individual locations: in-depth profiles written for the atlas, plus basic listings built from Wikidata. Every fact links to its source.',
    to: '/states',
    cta: 'Browse by state',
  },
];

export function HomePage() {
  const featuredType = getFeaturedPlaceType();
  const featuredBrand = getFeaturedBrand();
  const categories = getCategoriesWithData();
  const states = getStates();
  const collections = getCollections();
  const counts = getSiteCounts();
  const cities = getCities();
  const profiles = getRecentlyAdded(6, getFullProfiles());
  const newListings = getRecentlyAdded(6, getPlaces().filter(isBasicListing));
  const stats = [
    { label: 'Places', value: counts.places },
    { label: 'In-depth profiles', value: counts.fullProfiles },
    { label: 'Place types', value: counts.placeTypes },
    { label: 'Categories', value: counts.categories },
  ];

  return (
    <>
      <Seo description="An atlas of the kinds of places that make up the United States, from travel centers and warehouse clubs to planned communities, ports and national parks." />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="border-b border-line bg-paper-white">
        <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-[3fr_2fr] lg:items-end">
          <div>
            <p className="eyebrow">USA Places Explorer · Discover Every Side of America</p>
            <h1 id="hero-title" className="mt-4 text-h1 md:text-display">
              America is more than its landmarks.
            </h1>
            <p className="prose-atlas mt-6 text-ink-muted">
              A roadside travel center, a warehouse club, a master-planned town and a national park
              each tell part of the American story. This atlas explains the kinds of places the
              country is made of and the brands behind them, and documents real examples with
              verified sources.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchField variant="hero" />
            </div>
          </div>
          <div className="hidden border-l border-line pl-8 lg:block">
            <p className="eyebrow">Coverage so far</p>
            <ul className="mt-3 space-y-1">
              {states.map((s) => (
                <li key={s.code}>
                  <Link to={`/states/${s.slug}`} className="text-h3 font-semibold text-navy-900 hover:underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The atlas in numbers, computed from the data */}
      <section aria-labelledby="numbers-title" className="container-page pt-section">
        <h2 id="numbers-title" className="sr-only">The atlas in numbers</h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="bg-paper-white p-5">
              <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{st.label}</dt>
              <dd className="mt-1 text-h2 font-semibold text-navy-900 md:text-h1">{formatNumber(st.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Three layers */}
      <section aria-labelledby="layers-title" className="container-page py-section">
        <h2 id="layers-title" className="sr-only">How the atlas is organized</h2>
        <div className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-3">
          {layers.map(({ icon: Icon, title, text, to, cta }) => (
            <div key={title} className="flex flex-col bg-paper-white p-6">
              <Icon aria-hidden="true" className="h-5 w-5 text-gold-ink" />
              <h3 className="mt-3 text-h4">{title}</h3>
              <p className="mt-2 flex-1 font-serif text-body text-ink-muted">{text}</p>
              <Link to={to} className="mt-4 text-small font-semibold text-navy-700 hover:underline">
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {(featuredType || featuredBrand) && (
        <section aria-labelledby="featured-title" className="container-page pb-section">
          <SectionHeading id="featured-title" eyebrow="Featured" title="Start here" />
          <div className="grid gap-6 md:grid-cols-2">
            {featuredType && <PlaceTypeCard type={featuredType} />}
            {featuredBrand && <BrandCard brand={featuredBrand} />}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section aria-labelledby="collections-title" className="container-page pb-section">
          <SectionHeading id="collections-title" eyebrow="Collections" title="Curated collections" action={{ label: 'All collections', to: '/collections' }} />
          <ul className="grid gap-4 md:grid-cols-3">
            {collections.slice(0, 6).map((c) => (
              <li key={c.id}>
                <CollectionCard collection={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {cities.length > 0 && (
        <section aria-labelledby="cities-title" className="container-page pb-section">
          <SectionHeading id="cities-title" eyebrow="In depth" title="Cities in depth" action={{ label: 'All cities', to: '/cities' }} />
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => <li key={c.id}><CityCard city={c} /></li>)}
          </ul>
        </section>
      )}

      {categories.length > 0 && (
        <section aria-labelledby="categories-title" className="container-page pb-section">
          <SectionHeading id="categories-title" eyebrow="Categories" title="Explore by category" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <CategoryCard category={c} typeCount={getPlaceTypesByCategory(c.id).length} placeCount={getCategoryPlaceCount(c.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="states-title" className="container-page pb-section">
        <SectionHeading id="states-title" eyebrow="States" title="Explore by state" action={{ label: 'All states', to: '/states' }} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.code}>
              <StateCard state={s} />
            </li>
          ))}
        </ul>
      </section>

      {profiles.length > 0 && (
        <section aria-labelledby="profiles-title" className="container-page pb-section">
          <SectionHeading id="profiles-title" eyebrow="Read in depth" title="In-depth profiles" />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {newListings.length > 0 && (
        <section aria-labelledby="recent-title" className="container-page pb-section">
          <SectionHeading id="recent-title" eyebrow="New in the atlas" title="Recently added listings" action={{ label: 'Browse by state', to: '/states' }} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newListings.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
