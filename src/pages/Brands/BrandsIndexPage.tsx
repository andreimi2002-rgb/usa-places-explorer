import { Building2 } from 'lucide-react';
import { BrandCard } from '../../components/cards/cards';
import { EmptyState, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { getBrands } from '../../lib/data-access';

export function BrandsIndexPage() {
  const brands = getBrands();
  return (
    <>
      <Seo
        title="Brands"
        description="The American brands whose locations have become places in their own right, with sourced key facts."
      />
      <PageHeader
        eyebrow="Brands"
        title="Brands that became places"
        intro={<p>Some chains are more than businesses. Their stores and stops are destinations, and their formats shape whole categories of places.</p>}
      />
      <div className="container-page py-section">
        {brands.length === 0 ? (
          <EmptyState icon={Building2} title="No brands published yet">
            Brand pages are being researched and will appear here once their key facts are verified.
          </EmptyState>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <li key={b.id}><BrandCard brand={b} /></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
