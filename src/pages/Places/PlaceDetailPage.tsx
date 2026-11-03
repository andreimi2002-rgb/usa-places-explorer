import { BookOpen, ExternalLink, Navigation } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { categoryColor } from '../../components/maps/category-colors';
import { PlaceSectionBlock } from '../../components/places/PlaceSectionBlock';
import { AtlasImage } from '../../components/ui/AtlasImage';
import { PageHero } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { SourceList } from '../../components/ui/SourceList';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { placeSectionDefinitions } from '../../config/place-sections';
import {
  getBrandById, getCategoryForPlace, getCityForPlace, getImage, getImages, getNearbyPlaces, getPlaceBySlug,
  getPlaceGeo, getPlaceTypeById, getSource, getSources, getStateByCode, isBasicListing,
} from '../../lib/data-access';
import { formatNumber } from '../../lib/format';
import type { Place, SectionFact } from '../../types';
import { NotFoundPage } from '../NotFound/NotFoundPage';

const PlacesMap = lazy(() => import('../../components/maps/PlacesMap'));

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function Glance({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-l border-line pl-4 first:border-l-0 first:pl-0">
      <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 truncate text-body font-semibold text-navy-900">{children}</dd>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="mt-1 text-body text-ink">{children}</dd>
    </div>
  );
}

/** The first "when it began" fact a place has, for the at-a-glance strip. */
function firstDateFact(place: Place): SectionFact | undefined {
  const facts = Object.values(place.sections).flatMap((s) => s?.facts ?? []);
  for (const label of ['opened', 'founded', 'established', 'built', 'dates from', 'declared a park']) {
    const hit = facts.find((f) => f.label.toLowerCase().startsWith(label));
    if (hit) return hit;
  }
  return undefined;
}

function NearbyRow({ place, miles }: { place: Place; miles: number }) {
  const t = getPlaceTypeById(place.placeTypeId);
  const img = place.imageIds[0] ? getImage(place.imageIds[0]) : undefined;
  const cat = getCategoryForPlace(place);
  return (
    <li className="group relative flex items-center gap-4 py-3">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded">
        {img ? (
          <img src={img.fileUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: categoryColor(cat?.id) }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={`/places/${place.slug}`}
          className="font-serif text-h4 font-semibold text-navy-900 after:absolute after:inset-0 group-hover:underline"
        >
          {place.name}
        </Link>
        <p className="truncate text-small text-ink-muted">{[t?.name, place.city].filter(Boolean).join(' · ')}</p>
      </div>
      <span className="shrink-0 text-small text-ink-subtle">{miles < 1 ? '< 1' : formatNumber(Math.round(miles))} mi</span>
    </li>
  );
}

export function PlaceDetailPage() {
  const { slug = '' } = useParams();
  const place = getPlaceBySlug(slug);
  if (!place) return <NotFoundPage />;

  const type = getPlaceTypeById(place.placeTypeId);
  const brand = place.brandId ? getBrandById(place.brandId) : undefined;
  const state = getStateByCode(place.stateCode);
  const category = getCategoryForPlace(place);
  const cityArea = getCityForPlace(place);
  const geo = getPlaceGeo(place);
  const [heroImage, ...moreImages] = getImages(place.imageIds);
  const sources = getSources(place.sourceIds);
  const coordSource = place.coordinatesSourceId ? getSource(place.coordinatesSourceId) : undefined;
  const wikipedia = sources.find((s) => s.kind === 'wikipedia');
  const nearby = getNearbyPlaces(place, 5);
  const hasCoords = place.lat !== null && place.lng !== null;
  const basic = isBasicListing(place);
  const dateFact = firstDateFact(place);

  // Type-specific sections in the order set by the place type. The overview's
  // text becomes the lede; its facts (if any) stay in their own block.
  const overview = place.sections.overview;
  const sectionKeys = (type?.sectionKeys ?? ['overview']).filter((key) => {
    const s = place.sections[key];
    if (!s) return false;
    if (key === 'overview') return Boolean(s.facts?.length || s.items?.length) && !basic;
    return true;
  });
  // The at-a-glance strip already shows the date fact.
  const basicFacts = basic ? (overview?.facts ?? []).filter((f) => f !== dateFact) : [];

  return (
    <>
      <Seo title={`${place.name}, ${state?.name ?? place.stateCode}`} description={place.summary} />

      <PageHero
        image={heroImage}
        crumbs={[
          ...(state ? [{ label: state.name, to: `/states/${state.slug}` }] : []),
          ...(cityArea ? [{ label: cityArea.areaName, to: `/cities/${cityArea.slug}` }] : []),
          ...(type ? [{ label: type.pluralName, to: `/types/${type.slug}` }] : []),
          { label: place.name },
        ]}
        eyebrow={[type?.name, [place.city, state?.name].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        title={place.name}
        intro={<p>{place.summary}</p>}
      />

      {/* At a glance */}
      <div className="border-b border-line bg-paper-white">
        <dl className="container-page grid grid-cols-2 gap-y-5 py-6 md:flex md:gap-8">
          {type && (
            <Glance label="Kind of place">
              <Link to={`/types/${type.slug}`} className="hover:underline">{type.name}</Link>
            </Glance>
          )}
          <Glance label="Where">
            {cityArea ? (
              <Link to={`/cities/${cityArea.slug}`} className="hover:underline">{place.city}, {state?.code}</Link>
            ) : (
              <>{place.city}, {state?.code}</>
            )}
          </Glance>
          {dateFact && <Glance label={dateFact.label}>{dateFact.value}</Glance>}
          {brand && (
            <Glance label="Brand">
              <Link to={`/brands/${brand.slug}`} className="hover:underline">{brand.name}</Link>
            </Glance>
          )}
          {place.officialWebsite && (
            <Glance label="Website">
              <a href={place.officialWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {hostname(place.officialWebsite)}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Glance>
          )}
        </dl>
      </div>

      <div className="container-page grid gap-12 py-section lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
        <article className="min-w-0 space-y-14">
          {!basic && overview?.body && <p className="lede first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-[4.2rem] first-letter:font-semibold first-letter:leading-[3.6rem] first-letter:text-navy-900">{overview.body}</p>}

          {basic && (
            <section aria-labelledby="about-title" className="space-y-5">
              <h2 id="about-title" className="text-h2">{basicFacts.length > 0 ? 'Key facts' : 'About this place'}</h2>
              {place.summaryKind !== 'written' && (
                <p className="max-w-prose text-body text-ink-muted">
                  We have not written about {place.name} yet. The essentials are above
                  {wikipedia ? ', and Wikipedia has the full story.' : '.'}
                </p>
              )}
              {basicFacts.length > 0 && (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {basicFacts.map((f) => (
                    <div key={f.label} className="rounded-md bg-paper-white p-4">
                      <dt className="text-caption font-semibold uppercase tracking-wider text-ink-muted">{f.label}</dt>
                      <dd className="mt-1 font-serif text-h3 font-semibold text-navy-900">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {wikipedia && (
                <a
                  href={wikipedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-navy-700 px-4 py-2.5 text-small font-semibold text-navy-700 hover:bg-navy-700 hover:text-paper-white"
                >
                  <BookOpen aria-hidden="true" className="h-4 w-4" />
                  Read the full story on Wikipedia
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </section>
          )}

          {sectionKeys.map((key) => {
            const section = place.sections[key];
            if (!section) return null;
            const shown = key === 'overview' ? { ...section, body: undefined } : section;
            return <PlaceSectionBlock key={key} id={`section-${key}`} definition={placeSectionDefinitions[key]} section={shown} />;
          })}

          {moreImages.length > 0 && (
            <section aria-labelledby="gallery-title">
              <h2 id="gallery-title" className="text-h2">Gallery</h2>
              <ul className="mt-5 grid gap-6 sm:grid-cols-2">
                {moreImages.map((img) => (
                  <li key={img.id}>
                    <AtlasImage image={img} aspect="aspect-[4/3]" className="overflow-hidden rounded-md" showCaption />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {nearby.length > 0 && (
            <section aria-labelledby="nearby-title">
              <h2 id="nearby-title" className="text-h2">Nearby</h2>
              <ul className="mt-3 divide-y divide-line">
                {nearby.map(({ place: p, miles }) => <NearbyRow key={p.id} place={p} miles={miles} />)}
              </ul>
              <p className="mt-2 text-caption text-ink-subtle">Straight-line distance between verified coordinates.</p>
            </section>
          )}
        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {hasCoords && (
            <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-paper-sunk" />}>
              <PlacesMap
                places={[place, ...nearby.map((n) => n.place)]}
                center={{ lat: place.lat!, lng: place.lng!, zoom: 11 }}
                label={`Map of ${place.name} and nearby places`}
                className="h-64"
              />
            </Suspense>
          )}

          <section aria-labelledby="facts-title">
            <h2 id="facts-title" className="font-sans text-h4">Details</h2>
            <dl className="mt-3">
              {category && (
                <Fact label="Category">
                  <Link to={`/categories/${category.slug}`} className="text-navy-700 hover:underline">{category.name}</Link>
                </Fact>
              )}
              <Fact label="Location">
                {[place.city, geo?.county && geo.county !== place.city ? geo.county : null].filter(Boolean).join(', ')}
                {state && (
                  <>
                    {', '}
                    <Link to={`/states/${state.slug}`} className="text-navy-700 hover:underline">{state.name}</Link>
                  </>
                )}
              </Fact>
              {place.address && <Fact label="Address">{place.address}</Fact>}
              {hasCoords && (
                <Fact label="Coordinates">
                  <span className="font-mono text-small">{place.lat!.toFixed(4)}, {place.lng!.toFixed(4)}</span>
                  {coordSource && <span className="block text-caption text-ink-subtle">Source: {coordSource.publisher}</span>}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-navy-700 hover:underline"
                  >
                    <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                    Open in OpenStreetMap
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Fact>
              )}
              {place.officialWebsite && (
                <Fact label="Official website">
                  <a
                    href={place.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all font-semibold text-navy-700 hover:underline"
                  >
                    {hostname(place.officialWebsite)}
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Fact>
              )}
            </dl>
          </section>

          <details className="group rounded-md border border-line bg-paper-white p-4 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-small font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
              Sources and verification ({sources.length})
              <span aria-hidden="true" className="text-ink-subtle transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-4 space-y-4">
              <VerificationBadge status={place.verificationStatus} lastVerified={place.lastVerified} />
              <p className="text-caption text-ink-subtle">
                {basic
                  ? place.wikidataId
                    ? place.summaryKind === 'written'
                      ? 'A basic listing: the summary was written for this atlas from the Wikipedia article, and the facts come from Wikidata. An in-depth profile has not been written yet.'
                      : 'A basic listing: the details come from Wikidata and the summary is generated from them. An in-depth profile has not been written yet.'
                    : "A basic listing: name, address and location come from OpenStreetMap. Check the brand's official store page before you visit."
                  : 'Text written for this atlas from the sources below.'}
              </p>
              <SourceList sources={sources} />
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}
