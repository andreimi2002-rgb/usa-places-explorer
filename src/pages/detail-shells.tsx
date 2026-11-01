/**
 * Phase 1 detail routes. Each resolves its record through data-access and
 * falls back to the 404 page. Full layouts replace these in later phases:
 * types/brands (Phase 2), places (Phase 3), categories/collections (Phase 4).
 */
import { useParams } from 'react-router';
import { Breadcrumbs, PageHeader } from '../components/ui/layout-primitives';
import { Seo } from '../components/ui/Seo';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import {
  getBrandBySlug, getCategoryBySlug, getCollectionBySlug, getPlaceBySlug, getPlaceTypeBySlug,
} from '../lib/data-access';
import { NotFoundPage } from './NotFound/NotFoundPage';

export function TypeDetailPage() {
  const { slug = '' } = useParams();
  const type = getPlaceTypeBySlug(slug);
  if (!type) return <NotFoundPage />;
  return (
    <>
      <Seo title={type.name} description={type.summary} />
      <PageHeader eyebrow="Place type" title={type.name} intro={<p>{type.summary}</p>}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Breadcrumbs items={[{ label: 'Place Types', to: '/types' }, { label: type.name }]} />
          <VerificationBadge status={type.verificationStatus} lastVerified={type.lastVerified} />
        </div>
      </PageHeader>
    </>
  );
}

export function BrandDetailPage() {
  const { slug = '' } = useParams();
  const brand = getBrandBySlug(slug);
  if (!brand) return <NotFoundPage />;
  return (
    <>
      <Seo title={brand.name} description={brand.summary} />
      <PageHeader eyebrow="Brand" title={brand.name} intro={<p>{brand.summary}</p>}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Breadcrumbs items={[{ label: 'Brands', to: '/brands' }, { label: brand.name }]} />
          <VerificationBadge status={brand.verificationStatus} lastVerified={brand.lastVerified} />
        </div>
      </PageHeader>
    </>
  );
}

export function PlaceDetailPage() {
  const { slug = '' } = useParams();
  const place = getPlaceBySlug(slug);
  if (!place) return <NotFoundPage />;
  return (
    <>
      <Seo title={place.name} description={place.summary} />
      <PageHeader eyebrow={place.city} title={place.name} intro={<p>{place.summary}</p>}>
        <div className="mt-6">
          <VerificationBadge status={place.verificationStatus} lastVerified={place.lastVerified} />
        </div>
      </PageHeader>
    </>
  );
}

export function CategoryDetailPage() {
  const { slug = '' } = useParams();
  const category = getCategoryBySlug(slug);
  if (!category) return <NotFoundPage />;
  return (
    <>
      <Seo title={category.name} description={category.description} />
      <PageHeader eyebrow="Category" title={category.name} intro={<p>{category.description}</p>} />
    </>
  );
}

export function CollectionDetailPage() {
  const { slug = '' } = useParams();
  const collection = getCollectionBySlug(slug);
  if (!collection) return <NotFoundPage />;
  return (
    <>
      <Seo title={collection.name} description={collection.intro} />
      <PageHeader eyebrow="Collection" title={collection.name} intro={<p>{collection.intro}</p>} />
    </>
  );
}
