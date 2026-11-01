import { MapPin } from 'lucide-react';
import { useParams } from 'react-router';
import { PlaceCard } from '../../components/cards/cards';
import { Breadcrumbs, EmptyState, PageHeader, SectionHeading } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getPlacesByState, getStateBySlug } from '../../lib/data-access';
import { NotFoundPage } from '../NotFound/NotFoundPage';

/** Phase 1 shell. Category breakdown and map arrive in Phases 4 and 5. */
export function StateDetailPage() {
  const { slug = '' } = useParams();
  const state = getStateBySlug(slug);
  if (!state) return <NotFoundPage />;

  const places = getPlacesByState(state.code);

  return (
    <>
      <Seo title={state.name} description={`Place types, brands and documented places in ${state.name}. ${state.intro}`} />
      <PageHeader eyebrow={`State · ${state.code}`} title={state.name} intro={<p>{state.intro}</p>}>
        <div className="mt-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'States', to: '/states' }, { label: state.name }]} />
        </div>
      </PageHeader>
      <div className="container-page py-section">
        <SectionHeading title={`Places in ${state.name}`} />
        {places.length === 0 ? (
          <EmptyState icon={MapPin} title="No places published yet">
            Places in {state.name} are being researched and will appear here once verified.
          </EmptyState>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <li key={p.id}><PlaceCard place={p} /></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
