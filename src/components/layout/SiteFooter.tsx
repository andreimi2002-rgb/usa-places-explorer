import { Link } from 'react-router';
import { getCategoriesWithData, getStates } from '../../lib/data-access';
import { mainNavItems } from '../navigation/nav-items';

export function SiteFooter() {
  const states = getStates();
  const categories = getCategoriesWithData();

  return (
    <footer className="mt-section border-t border-line-dark bg-navy-950 text-navy-100">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="text-body font-bold text-paper-white">USA Places Explorer</p>
          <p className="mt-1 text-small text-navy-200">Discover Every Side of America.</p>
          <p className="mt-6 max-w-sm text-small text-navy-200">
            <strong className="font-semibold text-paper-white">Data disclaimer.</strong> Every fact is
            checked against a cited source and labelled with when it was checked. Things change,
            so confirm details with the official source before you travel. Fields we could not
            verify are left blank on purpose.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow text-gold">Explore</p>
          <ul className="mt-3 space-y-2 text-small">
            {mainNavItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-paper-white hover:underline">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow text-gold">States</p>
          <ul className="mt-3 space-y-2 text-small">
            {states.map((s) => (
              <li key={s.code}>
                <Link to={`/states/${s.slug}`} className="hover:text-paper-white hover:underline">{s.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {categories.length > 0 && (
          <div>
            <p className="eyebrow text-gold">Categories</p>
            <ul className="mt-3 space-y-2 text-small">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/categories/${c.slug}`} className="hover:text-paper-white hover:underline">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-line-dark">
        <div className="container-page flex flex-col gap-2 py-5 text-caption text-navy-200 sm:flex-row sm:justify-between">
          <p>Photos from Wikimedia Commons under their own licenses, credited on each image.</p>
          <p>
            Map data &copy;{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-paper-white">
              OpenStreetMap contributors
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
