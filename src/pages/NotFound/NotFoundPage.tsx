import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { SearchField } from '../../components/search/SearchField';
import { Seo } from '../../components/ui/Seo';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="The page you were looking for is not in the atlas." />
      <section className="container-page py-section-lg">
        <div className="mx-auto max-w-xl text-center">
          <Compass aria-hidden="true" className="mx-auto h-10 w-10 text-gold-ink" />
          <p className="eyebrow mt-6">Error 404</p>
          <h1 className="mt-2 text-h2 md:text-h1">This place is not on the map</h1>
          <p className="prose-atlas mx-auto mt-4 text-ink-muted">
            The page may have moved, or the record may not have been published yet. Try a search or
            start from one of the main sections.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <SearchField variant="hero" />
          </div>
          <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-small font-semibold">
            <Link to="/" className="link">Home</Link>
            <Link to="/types" className="link">Place types</Link>
            <Link to="/brands" className="link">Brands</Link>
            <Link to="/states" className="link">States</Link>
          </p>
        </div>
      </section>
    </>
  );
}
