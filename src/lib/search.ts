import type { Brand, Place, PlaceType } from '../types';
import {
  getBrands, getCategoryForPlace, getCategoryById, getCityForPlace, getLocality, getPlaceGeo, getPlaceTypeById,
  getPlaces, getPlaceTypes, getStateByCode,
} from './data-access';

export type SearchResultKind = 'type' | 'brand' | 'place';

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  summary: string;
  href: string;
  /** Short context line, e.g. "Travel Center · Texas". */
  meta: string;
  categoryId: string | null;
  stateCode: string | null;
  score: number;
}

export interface SearchFilters {
  kinds?: SearchResultKind[];
  categoryId?: string | null;
  stateCode?: string | null;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '');

/** Simple weighted match: every query word must appear somewhere. */
function score(query: string[], title: string, extra: string[]): number {
  const t = normalize(title);
  const rest = normalize(extra.join(' '));
  let total = 0;
  for (const word of query) {
    if (t.startsWith(word)) total += 5;
    else if (t.includes(word)) total += 3;
    else if (rest.includes(word)) total += 1;
    else return 0;
  }
  return total;
}

function typeResult(t: PlaceType, q: string[]): SearchResult {
  const category = getCategoryById(t.categoryId);
  return {
    kind: 'type', id: t.id, title: t.name, summary: t.summary, href: `/types/${t.slug}`,
    meta: `Place type${category ? ` · ${category.name}` : ''}`,
    categoryId: t.categoryId, stateCode: null,
    score: score(q, t.name, [t.pluralName, t.summary, category?.name ?? '']),
  };
}

function brandResult(b: Brand, q: string[]): SearchResult {
  const typeNames = b.placeTypeIds.map((id) => getPlaceTypeById(id)?.name ?? '');
  const firstType = b.placeTypeIds[0] ? getPlaceTypeById(b.placeTypeIds[0]) : undefined;
  return {
    kind: 'brand', id: b.id, title: b.name, summary: b.summary, href: `/brands/${b.slug}`,
    meta: `Brand${typeNames.filter(Boolean).length ? ` · ${typeNames.filter(Boolean).join(', ')}` : ''}`,
    categoryId: firstType?.categoryId ?? null, stateCode: null,
    score: score(q, b.name, [b.summary, ...typeNames]),
  };
}

function placeResult(p: Place, q: string[]): SearchResult {
  const type = getPlaceTypeById(p.placeTypeId);
  const state = getStateByCode(p.stateCode);
  return {
    kind: 'place', id: p.id, title: p.name, summary: p.summary, href: `/places/${p.slug}`,
    meta: [type?.name, [p.city, state?.name].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    categoryId: getCategoryForPlace(p)?.id ?? null, stateCode: p.stateCode,
    score: score(q, p.name, [
      p.summary, p.city, getLocality(p), getPlaceGeo(p)?.county ?? '', getCityForPlace(p)?.areaName ?? '',
      state?.name ?? '', type?.name ?? '',
    ]),
  };
}

/** Search place types, brands and places. Returns results sorted by relevance. */
export function searchAll(rawQuery: string, filters: SearchFilters = {}): SearchResult[] {
  const q = normalize(rawQuery).split(/\s+/).filter(Boolean);
  if (q.length === 0) return [];

  const results = [
    ...getPlaceTypes().map((t) => typeResult(t, q)),
    ...getBrands().map((b) => brandResult(b, q)),
    ...getPlaces().map((p) => placeResult(p, q)),
  ];

  return results
    .filter((r) => r.score > 0)
    .filter((r) => !filters.kinds?.length || filters.kinds.includes(r.kind))
    .filter((r) => !filters.categoryId || r.categoryId === filters.categoryId)
    // Types and brands are not tied to a state, so a state filter keeps only places.
    .filter((r) => !filters.stateCode || r.stateCode === filters.stateCode)
    // Stable sort: equal scores keep types, brands, then places by prominence.
    .sort((a, b) => b.score - a.score);
}
