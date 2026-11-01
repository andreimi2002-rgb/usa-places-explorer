import { Compass, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { mainNavItems } from '../navigation/nav-items';
import { SearchField } from '../search/SearchField';

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-2 text-small font-medium transition-colors ${
    isActive
      ? 'text-paper-white after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-gold'
      : 'text-navy-100 hover:text-paper-white'
  }`;

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `block border-b border-line-dark px-1 py-3 text-body font-medium ${
    isActive ? 'text-gold' : 'text-paper-white'
  }`;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-[1000] border-b border-line-dark bg-navy-900 text-paper-white">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="USA Places Explorer, home">
          <span className="flex h-8 w-8 items-center justify-center rounded border border-gold/60">
            <Compass aria-hidden="true" className="h-[18px] w-[18px] text-gold" />
          </span>
          <span className="leading-tight">
            <span className="block text-small font-bold tracking-tight">USA Places Explorer</span>
            <span className="hidden text-caption text-navy-200 sm:block">Discover Every Side of America</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center">
            {mainNavItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={desktopLink}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-64 md:block lg:ml-2 xl:w-72">
          <SearchField key={location.search} />
        </div>

        <button
          type="button"
          className="-mr-2 ml-auto inline-flex h-10 w-10 items-center justify-center rounded text-paper-white hover:bg-navy-700 md:ml-0 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line-dark bg-navy-900 lg:hidden">
          <div className="container-page pb-6 pt-4">
            <div className="md:hidden">
              <SearchField onSubmitted={() => setOpen(false)} />
            </div>
            <nav aria-label="Main" className="mt-2">
              <ul>
                {mainNavItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={mobileLink}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
