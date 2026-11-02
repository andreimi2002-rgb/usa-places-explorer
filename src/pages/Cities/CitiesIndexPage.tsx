import { Building } from 'lucide-react';
import { CityCard } from '../../components/cards/cards';
import { EmptyState, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getCities } from '../../lib/data-access';

export function CitiesIndexPage() {
  const cities = getCities();
  return (
    <>
      <Seo
        title="Cities"
        description="City areas covered in depth: every notable place in the metro area, mapped and filterable by town and category."
      />
      <PageHeader
        eyebrow="Cities"
        title="Cities in depth"
        intro={
          <p>
            Some areas are covered in depth: every notable place in the metro area, from theme parks to lakes and
            train stations, mapped and filterable by town. Orlando is the first; more cities will follow.
          </p>
        }
      />
      <div className="container-page py-section">
        {cities.length === 0 ? (
          <EmptyState icon={Building} title="No cities yet" />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => <li key={c.id}><CityCard city={c} /></li>)}
          </ul>
        )}
      </div>
    </>
  );
}
