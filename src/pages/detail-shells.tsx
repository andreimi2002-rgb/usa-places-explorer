/**
 * Detail routes still waiting for their full layouts: categories and
 * collections (Phase 4). Each resolves its record through
 * data-access and falls back to the 404 page.
 */
import { useParams } from 'react-router';
import { PlaceTypeCard } from '../components/cards/cards';
import { Breadcrumbs, PageHeader, SectionHeading } from '../components/ui/layout-primitives';
import { Seo } from '../components/ui/Seo';
import {
  getCategoryBySlug, getCollectionBySlug, getPlaceTypesByCategory,
} from '../lib/data-access';
import { NotFoundPage } from './NotFound/NotFoundPage';

export function CategoryDetailPage() {
  const { slug = '' } = useParams();
  const category = getCategoryBySlug(slug);
  if (!category) return <NotFoundPage />;
  const types = getPlaceTypesByCategory(category.id);
  return (
    <>
      <Seo title={category.name} description={category.description} />
      <PageHeader eyebrow="Category" title={category.name} intro={<p>{category.description}</p>}>
        <div className="mt-6">
          <Breadcrumbs items={[{ label: 'Place Types', to: '/types' }, { label: category.name }]} />
        </div>
      </PageHeader>
      <div className="container-page py-section">
        <SectionHeading title="Place types in this category" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => <li key={t.id}><PlaceTypeCard type={t} /></li>)}
        </ul>
      </div>
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
