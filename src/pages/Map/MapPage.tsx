import { Map } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getMappablePlaces } from '../../lib/data-access';
import { pluralize } from '../../lib/format';

/** Phase 1 shell. The Leaflet map with filters is built in Phase 5. */
export function MapPage() {
  const mappable = getMappablePlaces();
  return (
    <>
      <Seo title="Map" description="Every documented place with verified coordinates, on one map, filterable by category and state." />
      <PageHeader
        eyebrow="Map"
        title="The atlas on a map"
        intro={<p>Only places with verified coordinates get a marker. Nothing is placed on the map by guesswork.</p>}
      />
      <div className="container-page py-section">
        {mappable.length === 0 ? (
          <EmptyState icon={Map} title="No mapped places yet">
            Markers will appear here as places with verified coordinates are published.
          </EmptyState>
        ) : (
          <p className="text-small text-ink-muted">{pluralize(mappable.length, 'place')} with verified coordinates.</p>
        )}
      </div>
    </>
  );
}
