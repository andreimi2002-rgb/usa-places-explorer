import { Database, ExternalLink, MapPin, Navigation } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { PlaceSectionBlock } from '../../components/places/PlaceSectionBlock';
import { AtlasImage } from '../../components/ui/AtlasImage';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { ArticleSection, Breadcrumbs, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { SourceList } from '../../components/ui/SourceList';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { placeSectionDefinitions } from '../../config/place-sections';
import {
  getBrandById, getCategoryForPlace, getImages, getNearbyPlaces, getPlaceBySlug, getPlaceTypeById,
  getCityForPlace, getPlaceGeo, getSource, getSources, getStateByCode, isBasicListing,
} from '../../lib/data-access';
import { formatNumber } from '../../lib/format';
import { NotFoundPage } from '../NotFound/NotFoundPage';

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function QuickFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="mt-1 text-body text-ink">{children}</dd>
    </div>
  );
}

const NotVerified = () => <span className="italic text-ink-subtle">Not yet verified</span>;

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
  const nearby = getNearbyPlaces(place, 4);
  const hasCoords = place.lat !== null && place.lng !== null;

  // Type-specific sections, in the order set by the place type's config.
  const sectionKeys = (type?.sectionKeys ?? ['overview']).filter((key) => place.sections[key]);

  return (
    <>
      <Seo title={`${place.name}, ${state?.name ?? place.stateCode}`} description={place.summary} />

      <PageHeader
        eyebrow={[type?.name, [place.city, state?.name].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        title={place.name}
        intro={<p>{place.summary}</p>}
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Breadcrumbs
            items={[
              ...(state ? [{ label: state.name, to: `/states/${state.slug}` }] : []),
              ...(cityArea ? [{ label: cityArea.areaName, to: `/cities/${cityArea.slug}` }] : []),
              ...(type ? [{ label: type.pluralName, to: `/types/${type.slug}` }] : []),
              { label: place.name },
            ]}
          />
          <VerificationBadge status={place.verificationStatus} lastVerified={place.lastVerified} />
        </div>
      </PageHeader>

      {isBasicListing(place) && (
        <div className="container-page pt-8">
          <aside
            aria-label="About this listing"
            className="flex gap-3 rounded border border-line bg-paper-white p-4 text-small text-ink-muted"
          >
            <Database aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" />
            <p>
              <strong className="font-semibold text-ink">Basic listing.</strong>{' '}
              {place.wikidataId ? (
                <>
                  Name, location, dates and website come from{' '}
                  <a href={`https://www.wikidata.org/wiki/${place.wikidataId}`} target="_blank" rel="noopener noreferrer" className="link">
                    Wikidata<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  , and the summary is generated from them. An in-depth profile has not been written yet; the
                  Wikipedia article in the sources has the full story.
                </>
              ) : (
                <>
                  Name, address and location come from{' '}
                  {coordSource ? (
                    <a href={coordSource.url} target="_blank" rel="noopener noreferrer" className="link">
                      OpenStreetMap<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    'OpenStreetMap'
                  )}
                  , and the summary is generated from them. Check the brand's official store page before you visit.
                </>
              )}
            </p>
          </aside>
        </div>
      )}

      <div className="container-page pt-10">
        <AtlasImage image={heroImage} aspect="aspect-[16/9] md:aspect-[21/9]" loading="eager" />
      </div>

      <div className="container-page grid gap-12 py-section lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="min-w-0 space-y-12">
          {sectionKeys.map((key) => {
            const section = place.sections[key];
            return section ? (
              <PlaceSectionBlock key={key} id={`section-${key}`} definition={placeSectionDefinitions[key]} section={section} />
            ) : null;
          })}

          {moreImages.length > 0 && (
            <ArticleSection id="gallery" title="Gallery">
              <ImageGallery images={moreImages} />
            </ArticleSection>
          )}

          {nearby.length > 0 && (
            <ArticleSection id="nearby" title="Nearby in the atlas">
              <ul className="divide-y divide-line rounded border border-line bg-paper-white">
                {nearby.map(({ place: p, miles }) => {
                  const t = getPlaceTypeById(p.placeTypeId);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <Link to={`/places/${p.slug}`} className="font-semibold text-navy-700 hover:underline">{p.name}</Link>
                        <p className="text-small text-ink-muted">{[t?.name, p.city].filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className="shrink-0 text-small text-ink-subtle">
                        {formatNumber(Math.round(miles))} mi
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-caption text-ink-subtle">Straight-line distance between verified coordinates.</p>
            </ArticleSection>
          )}
        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="facts-title" className="rounded border border-line bg-paper-white p-5">
            <h2 id="facts-title" className="text-h4">Quick facts</h2>
            <dl className="mt-4 space-y-3">
              {type && (
                <QuickFact label="Place type">
                  <Link to={`/types/${type.slug}`} className="font-semibold text-navy-700 hover:underline">{type.name}</Link>
                  {category && <span className="block text-small text-ink-muted">{category.name}</span>}
                </QuickFact>
              )}
              {brand && (
                <QuickFact label="Brand">
                  <Link to={`/brands/${brand.slug}`} className="font-semibold text-navy-700 hover:underline">{brand.name}</Link>
                </QuickFact>
              )}
              <QuickFact label="Location">
                {place.city}
                {state && (
                  <>
                    {', '}
                    <Link to={`/states/${state.slug}`} className="text-navy-700 hover:underline">{state.name}</Link>
                  </>
                )}
              </QuickFact>
              {(geo?.county || cityArea) && (
                <QuickFact label="County and area">
                  {geo?.county && <span className="block">{geo.county}</span>}
                  {cityArea && (
                    <Link to={`/cities/${cityArea.slug}`} className="text-navy-700 hover:underline">{cityArea.areaName}</Link>
                  )}
                </QuickFact>
              )}
              <QuickFact label="Address">{place.address ?? <NotVerified />}</QuickFact>
              <QuickFact label="Coordinates">
                {hasCoords ? (
                  <>
                    <span className="font-mono text-small">{place.lat!.toFixed(4)}, {place.lng!.toFixed(4)}</span>
                    {coordSource && (
                      <span className="block text-caption text-ink-subtle">
                        Source:{' '}
                        <a href={coordSource.url} target="_blank" rel="noopener noreferrer" className="link">{coordSource.publisher}</a>
                      </span>
                    )}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-small font-semibold text-navy-700 hover:underline"
                    >
                      <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                      View on OpenStreetMap
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </>
                ) : (
                  <>
                    <NotVerified />
                    <span className="block text-caption text-ink-subtle">No map marker until coordinates are verified.</span>
                  </>
                )}
              </QuickFact>
              {place.officialWebsite && (
                <QuickFact label="Official website">
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
                </QuickFact>
              )}
            </dl>
          </section>

          {state && (
            <Link
              to={`/states/${state.slug}`}
              className="flex items-center gap-2 rounded border border-line bg-paper-white p-4 text-small font-semibold text-navy-700 hover:border-navy-300"
            >
              <MapPin aria-hidden="true" className="h-4 w-4 text-gold-ink" />
              More places in {state.name}
            </Link>
          )}

          <section aria-labelledby="sources-title">
            <h2 id="sources-title" className="text-h4">Sources</h2>
            <p className="mt-1 text-caption text-ink-subtle">
              {isBasicListing(place)
                ? 'Data for this listing comes from the sources below.'
                : 'Text written for this atlas from the sources below.'}
            </p>
            <div className="mt-4">
              <SourceList sources={sources} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
