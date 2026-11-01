import { Library } from 'lucide-react';
import { CollectionCard } from '../../components/cards/cards';
import { EmptyState, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getCollections } from '../../lib/data-access';
import { MIN_COLLECTION_SIZE } from '../../types';

export function CollectionsIndexPage() {
  const collections = getCollections();
  return (
    <>
      <Seo title="Collections" description="Curated collections of American places: roadside stops, retail giants, resorts, wild lands and working infrastructure." />
      <PageHeader
        eyebrow="Collections"
        title="Curated collections"
        intro={<p>Groups of documented places that tell a larger story together. A collection is published once it has at least {MIN_COLLECTION_SIZE} verified places.</p>}
      />
      <div className="container-page py-section">
        {collections.length === 0 ? (
          <EmptyState icon={Library} title="No collections published yet">
            Collections will appear once enough places have been verified to fill them.
          </EmptyState>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <li key={c.id}><CollectionCard collection={c} /></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
