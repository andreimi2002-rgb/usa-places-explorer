import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  getCategoryById, getCategoryForPlace, getCollectionPlaces, getImage, getLocalityBreakdown, getPlacesByCity,
  getPlaceTypeById, getStateByCode, getStateRecordCounts, isBasicListing,
} from '../../lib/data-access';
import { pluralize } from '../../lib/format';
import type { Brand, Category, City, Collection, ImageAsset, Place, PlaceType, State } from '../../types';
import { categoryColor } from '../maps/category-colors';
import { AtlasImage, PhotoCredit, TypeArt } from '../ui/AtlasImage';
import { categoryIcons } from '../ui/icons';

/** Makes the whole card clickable while keeping a single real link inside. */
const stretchedLink = 'after:absolute after:inset-0 after:content-[""]';
const zoom = 'transition-transform duration-500 ease-out group-hover:scale-[1.03]';

function categoryArt(categoryId: string | undefined, label: string, aspect = 'aspect-[4/3]') {
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const Icon = category ? categoryIcons[category.icon] : undefined;
  return <TypeArt label={label} icon={Icon ? <Icon /> : undefined} color={categoryColor(categoryId)} aspect={aspect} />;
}

// ---------------------------------------------------------------------------
// Image-first cards (places, types, brands)
// ---------------------------------------------------------------------------

function EditorialCard({
  href, image, fallback, eyebrow, title, text, aspect = 'aspect-[4/3]', size = 'md',
}: {
  href: string;
  image: ImageAsset | undefined;
  fallback: ReactNode;
  eyebrow?: string;
  title: string;
  text?: string | null;
  aspect?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="overflow-hidden rounded-md">
        <AtlasImage image={image} aspect={aspect} imgClassName={zoom} fallback={fallback} />
      </div>
      {eyebrow && <p className="eyebrow mt-4">{eyebrow}</p>}
      <h3 className={`mt-1.5 font-serif font-semibold leading-snug text-navy-900 ${size === 'lg' ? 'text-h2' : 'text-h3'}`}>
        <Link to={href} className={`${stretchedLink} decoration-gold decoration-2 underline-offset-4 group-hover:underline`}>
          {title}
        </Link>
      </h3>
      {text && <p className="mt-2 line-clamp-3 text-small text-ink-muted">{text}</p>}
    </article>
  );
}

export function PlaceCard({ place, size = 'md' }: { place: Place; size?: 'md' | 'lg' }) {
  const image = place.imageIds[0] ? getImage(place.imageIds[0]) : undefined;
  const type = getPlaceTypeById(place.placeTypeId);
  const state = getStateByCode(place.stateCode);
  const category = getCategoryForPlace(place);
  return (
    <EditorialCard
      href={`/places/${place.slug}`}
      image={image}
      fallback={categoryArt(category?.id, type?.name ?? 'Place')}
      eyebrow={[type?.name, [place.city, state?.code].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
      title={place.name}
      // Listing summaries repeat the eyebrow; only written profiles get a line of text.
      text={isBasicListing(place) && place.summaryKind !== 'written' ? null : place.summary}
      size={size}
    />
  );
}

export function PlaceTypeCard({ type }: { type: PlaceType }) {
  const category = getCategoryById(type.categoryId);
  const image = type.imageIds[0] ? getImage(type.imageIds[0]) : undefined;
  return (
    <EditorialCard
      href={`/types/${type.slug}`}
      image={image}
      fallback={categoryArt(category?.id, type.name)}
      eyebrow={category?.name}
      title={type.name}
      text={type.summary}
    />
  );
}

export function BrandCard({ brand }: { brand: Brand }) {
  const image = brand.imageIds[0] ? getImage(brand.imageIds[0]) : undefined;
  const types = brand.placeTypeIds.map((id) => getPlaceTypeById(id)?.name).filter(Boolean);
  const firstType = brand.placeTypeIds[0] ? getPlaceTypeById(brand.placeTypeIds[0]) : undefined;
  return (
    <EditorialCard
      href={`/brands/${brand.slug}`}
      image={image}
      fallback={categoryArt(firstType?.categoryId, brand.name)}
      eyebrow={types.join(' · ')}
      title={brand.name}
      text={brand.summary}
    />
  );
}

// ---------------------------------------------------------------------------
// Photo tiles: text over the image (states, cities, collections)
// ---------------------------------------------------------------------------

export function PhotoTile({
  href, image, eyebrow, title, meta, aspect = 'aspect-[4/5]', titleSize = 'text-h2',
}: {
  href: string;
  image: ImageAsset | undefined;
  eyebrow?: string;
  title: string;
  meta?: string;
  aspect?: string;
  titleSize?: string;
}) {
  return (
    <article className={`group relative isolate ${aspect} overflow-hidden rounded-md bg-navy-800`}>
      {image && (
        <img
          src={image.fileUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 -z-10 h-full w-full object-cover ${zoom}`}
        />
      )}
      <div className="hero-scrim absolute inset-0 -z-10" />
      <div className="flex h-full flex-col justify-end p-5 text-paper-white md:p-6">
        {eyebrow && <p className="text-eyebrow font-semibold uppercase text-gold">{eyebrow}</p>}
        <h3 className={`mt-1 font-serif ${titleSize} font-semibold leading-tight text-paper-white`}>
          <Link to={href} className={`${stretchedLink} decoration-gold decoration-2 underline-offset-4 group-hover:underline`}>
            {title}
          </Link>
        </h3>
        {meta && <p className="mt-2 text-small text-paper-white/85">{meta}</p>}
      </div>
      {image && <PhotoCredit image={image} className="right-2 top-2" />}
    </article>
  );
}

export function StateCard({ state }: { state: State }) {
  const counts = getStateRecordCounts(state.code);
  const image = state.heroImageId ? getImage(state.heroImageId) : undefined;
  return (
    <PhotoTile
      href={`/states/${state.slug}`}
      image={image}
      eyebrow={state.code}
      title={state.name}
      meta={counts.places > 0 ? `${pluralize(counts.places, 'place')} · ${pluralize(counts.placeTypes, 'kind', 'kinds')} of place` : 'Places being researched'}
    />
  );
}

export function CityCard({ city, aspect }: { city: City; aspect?: string }) {
  const image = city.heroImageId ? getImage(city.heroImageId) : undefined;
  const places = getPlacesByCity(city);
  const towns = getLocalityBreakdown(places).length;
  const state = getStateByCode(city.stateCode);
  return (
    <PhotoTile
      href={`/cities/${city.slug}`}
      image={image}
      eyebrow={`City in depth · ${state?.name ?? city.stateCode}`}
      title={city.areaName}
      meta={`${pluralize(places.length, 'place')} · ${pluralize(towns, 'city or town', 'cities and towns')}`}
      aspect={aspect}
    />
  );
}

/** First photo among a collection's places, used as its cover. */
export function getCollectionCover(collection: Collection): ImageAsset | undefined {
  for (const p of getCollectionPlaces(collection)) {
    const img = p.imageIds[0] ? getImage(p.imageIds[0]) : undefined;
    if (img) return img;
  }
  return undefined;
}

export function CollectionCard({ collection, aspect = 'aspect-[4/3]' }: { collection: Collection; aspect?: string }) {
  const count = getCollectionPlaces(collection).length;
  return (
    <div className="flex h-full flex-col">
      <PhotoTile
        href={`/collections/${collection.slug}`}
        image={getCollectionCover(collection)}
        eyebrow={`Collection · ${pluralize(count, 'place')}`}
        title={collection.name}
        aspect={aspect}
        titleSize="text-h3 md:text-h2"
      />
      <p className="mt-3 line-clamp-3 font-serif text-body text-ink-muted">{collection.intro}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text-only
// ---------------------------------------------------------------------------

export function CategoryCard({
  category, typeCount, placeCount,
}: { category: Category; typeCount: number; placeCount?: number }) {
  const Icon = categoryIcons[category.icon];
  return (
    <article className="group relative flex items-center gap-4 border-t border-line py-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-paper-white"
        style={{ backgroundColor: categoryColor(category.id) }}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-h4 font-semibold">
          <Link to={`/categories/${category.slug}`} className={`${stretchedLink} group-hover:underline`}>
            {category.name}
          </Link>
        </h3>
        <p className="text-small text-ink-muted">
          {[placeCount !== undefined ? pluralize(placeCount, 'place') : null, pluralize(typeCount, 'kind', 'kinds')].filter(Boolean).join(' · ')}
        </p>
      </div>
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-1 group-hover:text-navy-700" />
    </article>
  );
}
