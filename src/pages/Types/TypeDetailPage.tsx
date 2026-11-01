import { Building2, Layers } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { PlaceCard } from '../../components/cards/cards';
import { AtlasImage } from '../../components/ui/AtlasImage';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { ArticleSection, Breadcrumbs, PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { SourceList } from '../../components/ui/SourceList';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import {
  getBrandsByType, getCategoryById, getImages, getPlacesByType, getPlaceTypeBySlug,
  getRelatedPlaceTypes, getSources,
} from '../../lib/data-access';
import { NotFoundPage } from '../NotFound/NotFoundPage';


export function TypeDetailPage() {
  const { slug = '' } = useParams();
  const type = getPlaceTypeBySlug(slug);
  if (!type) return <NotFoundPage />;

  const category = getCategoryById(type.categoryId);
  const brands = getBrandsByType(type.id);
  const places = getPlacesByType(type.id);
  const related = getRelatedPlaceTypes(type);
  const [heroImage, ...moreImages] = getImages(type.imageIds);
  const sources = getSources(type.sourceIds);

  return (
    <>
      <Seo title={`${type.name}: what it is`} description={type.summary} />

      <PageHeader
        eyebrow={category ? `Place type · ${category.name}` : 'Place type'}
        title={type.name}
        intro={<p>{type.summary}</p>}
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Breadcrumbs
            items={[
              { label: 'Place Types', to: '/types' },
              ...(category ? [{ label: category.name, to: `/categories/${category.slug}` }] : []),
              { label: type.name },
            ]}
          />
          <VerificationBadge status={type.verificationStatus} lastVerified={type.lastVerified} />
        </div>
      </PageHeader>

      <div className="container-page pt-10">
        <AtlasImage image={heroImage} aspect="aspect-[16/9] md:aspect-[21/9]" loading="eager" />
      </div>

      <div className="container-page grid gap-12 py-section lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="min-w-0 space-y-14">
          <ArticleSection id="what-it-is" title={`What is a ${type.name.toLowerCase()}?`}>
            <div className="prose-atlas">
              {type.definition.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </div>
          </ArticleSection>

          {type.comparison && (
            <ArticleSection id="comparison" title="How it compares">
              <div className="table-scroll">
                <table className="w-full min-w-[640px] border-collapse text-left text-small">
                  <caption className="border-b border-line px-4 py-3 text-left text-caption text-ink-subtle">
                    {type.comparison.caption}
                  </caption>
                  <thead className="bg-paper-sunk">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold text-ink-muted">
                        <span className="sr-only">Aspect</span>
                      </th>
                      {type.comparison.columns.map((c, i) => (
                        <th key={c} scope="col" className={`px-4 py-3 font-semibold ${i === 0 ? 'text-navy-900' : 'text-ink-muted'}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {type.comparison.rows.map((row) => (
                      <tr key={row.aspect} className="border-t border-line align-top">
                        <th scope="row" className="px-4 py-3 font-semibold text-navy-900">{row.aspect}</th>
                        {row.values.map((v, i) => (
                          <td key={`${row.aspect}-${i}`} className={`px-4 py-3 ${i === 0 ? 'bg-gold-soft/40 text-ink' : 'text-ink-muted'}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ArticleSection>
          )}

          {type.anatomy.length > 0 && (
            <ArticleSection id="anatomy" title={`Anatomy of a ${type.name.toLowerCase()}`}>
              <ol className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
                {type.anatomy.map((item, i) => (
                  <li key={item.title} className="bg-paper-white p-5 sm:[&:last-child:nth-child(odd)]:col-span-2">
                    <p className="text-caption font-semibold text-gold-ink">{String(i + 1).padStart(2, '0')}</p>
                    <h3 className="mt-1 text-h4">{item.title}</h3>
                    <p className="mt-2 text-small text-ink-muted">{item.description}</p>
                  </li>
                ))}
              </ol>
            </ArticleSection>
          )}

          {type.whereCommon.length > 0 && (
            <ArticleSection id="where" title="Where they are common">
              <div className="prose-atlas">
                {type.whereCommon.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
              </div>
            </ArticleSection>
          )}

          {places.length > 0 && (
            <ArticleSection id="examples" title="Notable examples in the atlas">
              <ul className="grid gap-6 sm:grid-cols-2">
                {places.map((p) => <li key={p.id}><PlaceCard place={p} /></li>)}
              </ul>
            </ArticleSection>
          )}

          {moreImages.length > 0 && (
            <ArticleSection id="gallery" title="Gallery">
              <ImageGallery images={moreImages} />
            </ArticleSection>
          )}
        </article>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          {brands.length > 0 && (
            <section aria-labelledby="brands-title" className="rounded border border-line bg-paper-white p-5">
              <h2 id="brands-title" className="flex items-center gap-2 text-h4">
                <Building2 aria-hidden="true" className="h-4 w-4 text-gold-ink" />
                Brands of this type
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {brands.map((b) => (
                  <li key={b.id} className="py-3">
                    <Link to={`/brands/${b.slug}`} className="font-semibold text-navy-700 hover:underline">{b.name}</Link>
                    <p className="mt-1 text-small text-ink-muted">{b.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="related-title" className="rounded border border-line bg-paper-white p-5">
              <h2 id="related-title" className="flex items-center gap-2 text-h4">
                <Layers aria-hidden="true" className="h-4 w-4 text-gold-ink" />
                Related place types
              </h2>
              <ul className="mt-3 space-y-2">
                {related.map((t) => (
                  <li key={t.id}>
                    <Link to={`/types/${t.slug}`} className="font-semibold text-navy-700 hover:underline">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="sources-title">
            <h2 id="sources-title" className="text-h4">Sources</h2>
            <p className="mt-1 text-caption text-ink-subtle">
              Text written for this atlas from the sources below. Comparisons describe typical sites.
            </p>
            <div className="mt-4">
              <SourceList sources={sources} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
