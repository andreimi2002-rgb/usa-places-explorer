import { ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { BrandCard, PlaceCard } from '../../components/cards/cards';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { ArticleSection, PageHero } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { SourceList } from '../../components/ui/SourceList';
import { SourcedValueDisplay } from '../../components/ui/SourcedValueDisplay';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import {
  getBrandBySlug, getImages, getPlacesByBrand, getPlaceTypeById, getRelatedBrands, getSources,
} from '../../lib/data-access';
import type { PlaceType } from '../../types';
import { NotFoundPage } from '../NotFound/NotFoundPage';


const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export function BrandDetailPage() {
  const { slug = '' } = useParams();
  const brand = getBrandBySlug(slug);
  if (!brand) return <NotFoundPage />;

  const types = brand.placeTypeIds
    .map((id) => getPlaceTypeById(id))
    .filter((t): t is PlaceType => t !== undefined);
  const places = getPlacesByBrand(brand.id);
  const related = getRelatedBrands(brand);
  const [heroImage, ...moreImages] = getImages(brand.imageIds);
  const sources = getSources(brand.sourceIds);
  const typeLabel = types.map((t) => t.name).join(' · ');

  return (
    <>
      <Seo title={brand.name} description={brand.summary} />

      <PageHero
        image={heroImage}
        crumbs={[{ label: 'Brands', to: '/brands' }, { label: brand.name }]}
        eyebrow={typeLabel ? `Brand · ${typeLabel}` : 'Brand'}
        title={brand.name}
        intro={<p>{brand.summary}</p>}
      />

      <div className="container-page grid gap-12 py-section lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="min-w-0 space-y-14">
          <ArticleSection id="distinctive" title={`What makes ${brand.name} distinctive`}>
            <div className="prose-atlas">
              {brand.distinctive.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </div>
          </ArticleSection>

          {places.length > 0 && (
            <ArticleSection id="locations" title="Notable locations in the atlas">
              <ul className="grid gap-6 sm:grid-cols-2">
                {places.map((p) => <li key={p.id}><PlaceCard place={p} /></li>)}
              </ul>
            </ArticleSection>
          )}

          {moreImages.length > 0 && (
            <ArticleSection id="gallery" title="Gallery">
              <ImageGallery images={moreImages} />
            </ArticleSection>
          )}

          {related.length > 0 && (
            <ArticleSection id="related" title="Related brands">
              <ul className="grid gap-6 sm:grid-cols-2">
                {related.map((b) => <li key={b.id}><BrandCard brand={b} /></li>)}
              </ul>
            </ArticleSection>
          )}
        </article>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="facts-title" className="rounded border border-line bg-paper-white p-5">
            <h2 id="facts-title" className="text-h4">Key facts</h2>
            <dl className="mt-3 space-y-4">
              <SourcedValueDisplay label="Founded" fact={brand.founded} render={(v) => String(v)} />
              <SourcedValueDisplay label="Headquarters" fact={brand.headquarters} />
              <SourcedValueDisplay label={`${brand.locationLabel} in the U.S.`} fact={brand.locationsUS} />
              {brand.locationsWorldwide && (
                <SourcedValueDisplay label={`${brand.locationLabel} in total`} fact={brand.locationsWorldwide} />
              )}
              {brand.officialWebsite && (
                <div className="border-t border-line pt-3">
                  <dt className="text-small text-ink-muted">Official website</dt>
                  <dd className="mt-1">
                    <a
                      href={brand.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:underline"
                    >
                      {hostname(brand.officialWebsite)}
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {types.length > 0 && (
            <section aria-labelledby="types-title" className="rounded border border-line bg-paper-white p-5">
              <h2 id="types-title" className="text-h4">Place type</h2>
              <ul className="mt-3 space-y-3">
                {types.map((t) => (
                  <li key={t.id}>
                    <Link to={`/types/${t.slug}`} className="font-semibold text-navy-700 hover:underline">{t.name}</Link>
                    <p className="mt-1 text-small text-ink-muted">{t.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="sources-title">
            <h2 id="sources-title" className="font-sans text-h4">Sources</h2>
            <div className="mt-2"><VerificationBadge status={brand.verificationStatus} lastVerified={brand.lastVerified} /></div>
            <div className="mt-4">
              <SourceList sources={sources} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
