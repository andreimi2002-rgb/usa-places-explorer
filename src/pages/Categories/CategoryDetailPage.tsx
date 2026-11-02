import { Link, useParams } from 'react-router';
import { PlaceBrowser } from '../../components/places/PlaceBrowser';
import { Breadcrumbs, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { categoryIcons } from '../../components/ui/icons';
import {
  getCategoryBySlug, getPlacesByCategory, getPlacesByType, getPlaceTypesByCategory,
} from '../../lib/data-access';
import { formatNumber, pluralize } from '../../lib/format';
import { NotFoundPage } from '../NotFound/NotFoundPage';

export function CategoryDetailPage() {
  const { slug = '' } = useParams();
  const category = getCategoryBySlug(slug);
  if (!category) return <NotFoundPage />;

  const types = getPlaceTypesByCategory(category.id);
  const places = getPlacesByCategory(category.id);
  const Icon = categoryIcons[category.icon];

  return (
    <>
      <Seo
        title={category.name}
        description={`${category.description} ${formatNumber(places.length)} places across ${pluralize(types.length, 'place type')}.`}
      />
      <PageHeader eyebrow="Category" title={category.name} intro={<p>{category.description}</p>}>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Breadcrumbs items={[{ label: 'Place Types', to: '/types' }, { label: category.name }]} />
          <p className="flex items-center gap-2 text-small text-ink-muted">
            <Icon aria-hidden="true" className="h-4 w-4 text-gold-ink" />
            {pluralize(places.length, 'place')} · {pluralize(types.length, 'place type')}
          </p>
        </div>
      </PageHeader>

      <section aria-labelledby="types-title" className="container-page pt-section">
        <SectionHeading id="types-title" eyebrow="Place types" title="Kinds of places in this category" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <li key={t.id}>
              <Link
                to={`/types/${t.slug}`}
                className="flex h-full flex-col rounded border border-line bg-paper-white p-4 hover:border-navy-300 hover:shadow-card"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-navy-900">{t.name}</span>
                  <span className="shrink-0 text-caption text-ink-muted">{pluralize(getPlacesByType(t.id).length, 'place')}</span>
                </span>
                <span className="mt-1 text-small text-ink-muted">{t.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="places-title" className="container-page py-section">
        <SectionHeading id="places-title" eyebrow="Browse" title={`All ${category.name.toLowerCase()} places`} />
        <PlaceBrowser places={places} filters={['state', 'type']} />
      </section>
    </>
  );
}
