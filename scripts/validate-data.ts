/**
 * Data integrity checks. Run with `npm run validate`.
 * Fails (non-zero exit) on broken references or records that break the data rules.
 */
import { brands } from '../src/data/brands';
import { categories } from '../src/data/categories';
import { collections } from '../src/data/collections';
import { images } from '../src/data/images';
import { places } from '../src/data/places';
import { placeTypes } from '../src/data/placeTypes';
import { sources } from '../src/data/sources';
import { states } from '../src/data/states';
import type { SourcedValue } from '../src/types';

export function validate(): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(msg);

  const ids = <T extends { id: string }>(list: T[], label: string) => {
    const set = new Set<string>();
    for (const item of list) {
      if (set.has(item.id)) err(`${label}: duplicate id ${item.id}`);
      set.add(item.id);
    }
    return set;
  };
  const slugs = <T extends { slug: string; id: string }>(list: T[], label: string) => {
    const seen = new Set<string>();
    for (const item of list) {
      if (seen.has(item.slug)) err(`${label}: duplicate slug ${item.slug}`);
      seen.add(item.slug);
    }
  };

  const sourceIds = ids(sources, 'sources');
  const imageIds = ids(images, 'images');
  const typeIds = ids(placeTypes, 'placeTypes');
  const brandIds = ids(brands, 'brands');
  const placeIds = ids(places, 'places');
  const categoryIds = ids(categories, 'categories');
  const stateCodes = new Set(states.map((s) => s.code));
  ids(collections, 'collections');
  slugs(placeTypes, 'placeTypes');
  slugs(brands, 'brands');
  slugs(places, 'places');
  slugs(collections, 'collections');

  const refs = (owner: string, list: string[], set: Set<string>, kind: string) => {
    for (const id of list) if (!set.has(id)) err(`${owner}: unknown ${kind} "${id}"`);
  };
  const sourced = (owner: string, label: string, v: SourcedValue<unknown> | null) => {
    if (!v || v.value === null) return;
    if (!v.sourceId || !v.asOf) err(`${owner}: "${label}" has a value but no source or as-of date`);
    else refs(owner, [v.sourceId], sourceIds, 'source');
  };

  for (const img of images) {
    if (!img.author || !img.license || !img.commonsPageUrl.startsWith('https://commons.wikimedia.org/')) {
      err(`image ${img.id}: missing author, license or Commons page`);
    }
  }

  for (const t of placeTypes) {
    const o = `type ${t.id}`;
    refs(o, [t.categoryId], categoryIds, 'category');
    refs(o, t.relatedTypeIds, typeIds, 'type');
    refs(o, t.imageIds, imageIds, 'image');
    refs(o, t.sourceIds, sourceIds, 'source');
    if (t.sourceIds.length === 0) err(`${o}: no sources`);
  }

  for (const b of brands) {
    const o = `brand ${b.id}`;
    refs(o, b.placeTypeIds, typeIds, 'type');
    refs(o, b.relatedBrandIds, brandIds, 'brand');
    refs(o, b.imageIds, imageIds, 'image');
    refs(o, b.sourceIds, sourceIds, 'source');
    sourced(o, 'founded', b.founded);
    sourced(o, 'headquarters', b.headquarters);
    sourced(o, 'locationsUS', b.locationsUS);
    sourced(o, 'locationsWorldwide', b.locationsWorldwide);
  }

  for (const p of places) {
    const o = `place ${p.id}`;
    const type = placeTypes.find((t) => t.id === p.placeTypeId);
    if (!type) err(`${o}: unknown type "${p.placeTypeId}"`);
    if (p.brandId) refs(o, [p.brandId], brandIds, 'brand');
    if (!stateCodes.has(p.stateCode)) err(`${o}: unknown state "${p.stateCode}"`);
    refs(o, p.imageIds, imageIds, 'image');
    refs(o, p.sourceIds, sourceIds, 'source');
    if (p.sourceIds.length === 0) err(`${o}: no sources`);

    // Coordinates: both or neither, inside the U.S., and always with a source.
    if ((p.lat === null) !== (p.lng === null)) err(`${o}: only one of lat/lng is set`);
    if (p.lat !== null && p.lng !== null) {
      if (p.lat < 18 || p.lat > 72 || p.lng < -180 || p.lng > -64) err(`${o}: coordinates outside the U.S.`);
      if (!p.coordinatesSourceId) err(`${o}: coordinates without a source`);
      else refs(o, [p.coordinatesSourceId], sourceIds, 'source');
    }

    for (const [key, section] of Object.entries(p.sections)) {
      if (type && !type.sectionKeys.includes(key as never)) {
        err(`${o}: section "${key}" is not in ${type.id}.sectionKeys, so it would never be shown`);
      }
      for (const f of section?.facts ?? []) {
        if (!f.sourceId || !f.asOf) err(`${o}: fact "${f.label}" has no source or as-of date`);
        else refs(o, [f.sourceId], sourceIds, 'source');
      }
    }
  }

  for (const c of collections) refs(`collection ${c.id}`, c.placeIds, placeIds, 'place');

  return errors;
}
