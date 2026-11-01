import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import {
  getCategoryById, getCollectionPlaces, getImage, getPlaceTypeById, getStateByCode,
  getStateRecordCounts,
} from '../../lib/data-access';
import { pluralize } from '../../lib/format';
import type { Brand, Category, Collection, Place, PlaceType, State } from '../../types';
import { AtlasImage } from '../ui/AtlasImage';
import { categoryIcons } from '../ui/icons';

const cardBase =
  'group relative flex h-full flex-col overflow-hidden rounded border border-line bg-paper-white shadow-card transition-shadow hover:shadow-raised';

/** Makes the whole card clickable while keeping a single real link inside. */
const stretchedLink = 'after:absolute after:inset-0 after:content-[""]';

export function StateCard({ state }: { state: State }) {
  const counts = getStateRecordCounts(state.code);
  return (
    <article className={`${cardBase} p-5`}>
      <p className="eyebrow">{state.code}</p>
      <h3 className="mt-1 text-h3">
        <Link to={`/states/${state.slug}`} className={`${stretchedLink} group-hover:underline`}>
          {state.name}
        </Link>
      </h3>
      <p className="mt-3 text-small text-ink-muted">
        {counts.places > 0
          ? `${pluralize(counts.places, 'place')} · ${pluralize(counts.placeTypes, 'place type')}`
          : 'Places being researched'}
      </p>
      <span aria-hidden="true" className="mt-auto pt-4 text-navy-700">
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </article>
  );
}

export function CategoryCard({ category, typeCount }: { category: Category; typeCount: number }) {
  const Icon = categoryIcons[category.icon];
  return (
    <article className={`${cardBase} flex-row items-start gap-4 p-5`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line bg-paper">
        <Icon aria-hidden="true" className="h-5 w-5 text-navy-700" />
      </span>
      <div>
        <h3 className="text-h4">
          <Link to={`/categories/${category.slug}`} className={`${stretchedLink} group-hover:underline`}>
            {category.name}
          </Link>
        </h3>
        <p className="mt-1 text-small text-ink-muted">{pluralize(typeCount, 'place type')}</p>
      </div>
    </article>
  );
}

export function PlaceTypeCard({ type }: { type: PlaceType }) {
  const category = getCategoryById(type.categoryId);
  const image = type.imageIds[0] ? getImage(type.imageIds[0]) : undefined;
  return (
    <article className={cardBase}>
      <AtlasImage image={image} aspect="aspect-[3/2]" showAttribution={false} className="rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        {category && <p className="eyebrow">{category.name}</p>}
        <h3 className="mt-1 text-h4">
          <Link to={`/types/${type.slug}`} className={`${stretchedLink} group-hover:underline`}>{type.name}</Link>
        </h3>
        <p className="mt-2 text-small text-ink-muted">{type.summary}</p>
      </div>
    </article>
  );
}

export function BrandCard({ brand }: { brand: Brand }) {
  const image = brand.imageIds[0] ? getImage(brand.imageIds[0]) : undefined;
  const types = brand.placeTypeIds.map((id) => getPlaceTypeById(id)?.name).filter(Boolean);
  return (
    <article className={cardBase}>
      <AtlasImage image={image} aspect="aspect-[3/2]" showAttribution={false} />
      <div className="flex flex-1 flex-col p-5">
        {types.length > 0 && <p className="eyebrow">{types.join(' · ')}</p>}
        <h3 className="mt-1 text-h4">
          <Link to={`/brands/${brand.slug}`} className={`${stretchedLink} group-hover:underline`}>{brand.name}</Link>
        </h3>
        <p className="mt-2 text-small text-ink-muted">{brand.summary}</p>
      </div>
    </article>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const image = place.imageIds[0] ? getImage(place.imageIds[0]) : undefined;
  const type = getPlaceTypeById(place.placeTypeId);
  const state = getStateByCode(place.stateCode);
  return (
    <article className={cardBase}>
      <AtlasImage image={image} aspect="aspect-[3/2]" showAttribution={false} />
      <div className="flex flex-1 flex-col p-5">
        {type && <p className="eyebrow">{type.name}</p>}
        <h3 className="mt-1 text-h4">
          <Link to={`/places/${place.slug}`} className={`${stretchedLink} group-hover:underline`}>{place.name}</Link>
        </h3>
        <p className="mt-2 flex items-center gap-1 text-small text-ink-muted">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          {[place.city, state?.name].filter(Boolean).join(', ')}
        </p>
      </div>
    </article>
  );
}

export function CollectionCard({ collection }: { collection: Collection }) {
  const count = getCollectionPlaces(collection).length;
  return (
    <article className={`${cardBase} p-5`}>
      <p className="eyebrow">Collection · {pluralize(count, 'place')}</p>
      <h3 className="mt-1 text-h3">
        <Link to={`/collections/${collection.slug}`} className={`${stretchedLink} group-hover:underline`}>
          {collection.name}
        </Link>
      </h3>
      <p className="mt-2 font-serif text-body text-ink-muted">{collection.intro}</p>
    </article>
  );
}
