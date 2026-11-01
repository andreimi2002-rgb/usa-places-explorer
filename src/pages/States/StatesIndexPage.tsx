import { StateCard } from '../../components/cards/cards';
import { PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getStates } from '../../lib/data-access';

export function StatesIndexPage() {
  const states = getStates();
  return (
    <>
      <Seo
        title="States"
        description="Browse the atlas by state. Version 1 covers Florida, Texas, Arizona and California."
      />
      <PageHeader
        eyebrow="States"
        title="Explore by state"
        intro={<p>The first edition of the atlas covers four states. More will follow as records are researched and verified.</p>}
      />
      <div className="container-page py-section">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.code}><StateCard state={s} /></li>
          ))}
        </ul>
      </div>
    </>
  );
}
