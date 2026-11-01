import { Layers } from 'lucide-react';
import { PlaceTypeCard } from '../../components/cards/cards';
import { EmptyState, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getCategoriesWithData, getPlaceTypesByCategory } from '../../lib/data-access';

export function TypesIndexPage() {
  const categories = getCategoriesWithData();
  return (
    <>
      <Seo
        title="Place Types"
        description="The kinds of places America is built from, explained: travel centers, warehouse clubs, theme park resorts, planned communities and more."
      />
      <PageHeader
        eyebrow="Place types"
        title="The kinds of places America is built from"
        intro={<p>Each place type page explains what the format is, how it differs from similar places, and where you find it.</p>}
      />
      <div className="container-page py-section">
        {categories.length === 0 ? (
          <EmptyState icon={Layers} title="No place types published yet">
            Place type pages are being researched and will appear here once their sources are verified.
          </EmptyState>
        ) : (
          <div className="space-y-section">
            {categories.map((c) => (
              <section key={c.id} aria-labelledby={`cat-${c.id}`}>
                <SectionHeading id={`cat-${c.id}`} title={c.name} action={{ label: 'Category page', to: `/categories/${c.slug}` }} />
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {getPlaceTypesByCategory(c.id).map((t) => (
                    <li key={t.id}><PlaceTypeCard type={t} /></li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
