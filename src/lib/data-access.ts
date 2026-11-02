/**
 * The only module that reads raw data files. Components and pages call these
 * functions instead of importing from `src/data` directly.
 */
import { brands } from '../data/brands';
import { categories } from '../data/categories';
import { collections } from '../data/collections';
import {
  allImages as images, allPlaces as places, allPlaceTypes as placeTypes, allSources as sources, placeGeo,
} from '../data/all';
import { cities } from '../data/cities';
import { states } from '../data/states';
import type {
  Brand, Category, City, Collection, ImageAsset, Place, PlaceGeo, PlaceType, Source, State,
} from '../types';
import { MIN_COLLECTION_SIZE } from '../types';

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

/** Full profiles first (featured ones leading), then listings by notability, then name. */
const byProminence = (a: Place, b: Place) =>
  Number(a.profile === 'basic') - Number(b.profile === 'basic') ||
  Number(b.featured) - Number(a.featured) ||
  (b.rank ?? 0) - (a.rank ?? 0) ||
  a.name.localeCompare(b.name);
const sortedPlaces = [...places].sort(byProminence);

function indexBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T> {
  return new Map(items.map((item) => [item[key], item]));
}

const placeTypeById = indexBy(placeTypes, 'id');
const brandById = indexBy(brands, 'id');
const placeById = indexBy(places, 'id');
const categoryById = indexBy(categories, 'id');
const stateByCode = indexBy(states, 'code');
const imageById = indexBy(images, 'id');
const sourceById = indexBy(sources, 'id');

function lookupMany<T>(map: Map<string, T>, ids: string[]): T[] {
  return ids.flatMap((id) => {
    const item = map.get(id);
    return item ? [item] : [];
  });
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const getStates = (): State[] => states.filter((s) => s.active);
export const getStateBySlug = (slug: string) => states.find((s) => s.slug === slug && s.active);
export const getStateByCode = (code: string) => stateByCode.get(code);

export interface StateRecordCounts {
  places: number;
  placeTypes: number;
  brands: number;
}

/** Counts computed from the data, never typed in by hand. */
export function getStateRecordCounts(code: string): StateRecordCounts {
  const statePlaces = getPlacesByState(code);
  return {
    places: statePlaces.length,
    placeTypes: new Set(statePlaces.map((p) => p.placeTypeId)).size,
    brands: new Set(statePlaces.flatMap((p) => (p.brandId ? [p.brandId] : []))).size,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const getAllCategories = (): Category[] =>
  [...categories].sort((a, b) => a.order - b.order);
export const getCategoryById = (id: string) => categoryById.get(id);

/** A category "has data" when at least one place type belongs to it. */
export const getCategoriesWithData = (): Category[] =>
  getAllCategories().filter((c) => getPlaceTypesByCategory(c.id).length > 0);

/** Place count per category, computed from the data. */
export const getCategoryPlaceCount = (categoryId: string) =>
  places.filter((p) => placeTypeById.get(p.placeTypeId)?.categoryId === categoryId).length;

/** Only categories with data are routable. */
export const getCategoryBySlug = (slug: string) =>
  getCategoriesWithData().find((c) => c.slug === slug);

// ---------------------------------------------------------------------------
// Place types
// ---------------------------------------------------------------------------

export const getPlaceTypes = (): PlaceType[] => [...placeTypes].sort(byName);
export const getPlaceTypeById = (id: string) => placeTypeById.get(id);
export const getPlaceTypeBySlug = (slug: string) => placeTypes.find((t) => t.slug === slug);
export const getPlaceTypesByCategory = (categoryId: string): PlaceType[] =>
  getPlaceTypes().filter((t) => t.categoryId === categoryId);
export const getRelatedPlaceTypes = (type: PlaceType): PlaceType[] =>
  lookupMany(placeTypeById, type.relatedTypeIds);
export const getFeaturedPlaceType = (): PlaceType | undefined =>
  placeTypes.find((t) => t.featured) ?? placeTypes[0];

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export const getBrands = (): Brand[] => [...brands].sort(byName);
export const getBrandById = (id: string) => brandById.get(id);
export const getBrandBySlug = (slug: string) => brands.find((b) => b.slug === slug);
export const getBrandsByType = (placeTypeId: string): Brand[] =>
  getBrands().filter((b) => b.placeTypeIds.includes(placeTypeId));
export const getRelatedBrands = (brand: Brand): Brand[] =>
  lookupMany(brandById, brand.relatedBrandIds);
export const getFeaturedBrand = (): Brand | undefined =>
  brands.find((b) => b.featured) ?? brands[0];

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

/** All places, full profiles first, then listings by notability. */
export const getPlaces = (): Place[] => sortedPlaces;
export const isBasicListing = (p: Place) => p.profile === 'basic';
export const getFullProfiles = (): Place[] => sortedPlaces.filter((p) => !isBasicListing(p));
export const getPlaceById = (id: string) => placeById.get(id);
export const getPlaceBySlug = (slug: string) => places.find((p) => p.slug === slug);
export const getPlacesByType = (placeTypeId: string): Place[] =>
  getPlaces().filter((p) => p.placeTypeId === placeTypeId);
export const getPlacesByBrand = (brandId: string): Place[] =>
  getPlaces().filter((p) => p.brandId === brandId);
export const getPlacesByState = (stateCode: string): Place[] =>
  getPlaces().filter((p) => p.stateCode === stateCode);
export const getPlacesByCategory = (categoryId: string): Place[] =>
  getPlaces().filter((p) => placeTypeById.get(p.placeTypeId)?.categoryId === categoryId);
export const getCategoryForPlace = (place: Place): Category | undefined => {
  const type = placeTypeById.get(place.placeTypeId);
  return type ? categoryById.get(type.categoryId) : undefined;
};

/** Places with verified coordinates only; others never get a map marker. */
export const getMappablePlaces = (list: Place[] = places) =>
  list.filter(
    (p): p is Place & { lat: number; lng: number } => p.lat !== null && p.lng !== null,
  );

/** Newest first; within the same day, the most prominent first. */
export function getRecentlyAdded(limit = 6, list: Place[] = sortedPlaces): Place[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byProminence(a, b)).slice(0, limit);
}

export interface CategoryCount {
  category: Category;
  count: number;
}

/** How many places of each category a list contains, largest first. */
export function getCategoryBreakdown(list: Place[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const p of list) {
    const id = placeTypeById.get(p.placeTypeId)?.categoryId;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts]
    .flatMap(([id, count]) => {
      const category = categoryById.get(id);
      return category ? [{ category, count }] : [];
    })
    .sort((a, b) => b.count - a.count || a.category.order - b.category.order);
}

/** Brands with at least one place in the state. */
export const getBrandsInState = (stateCode: string): Brand[] =>
  getBrands().filter((b) => places.some((p) => p.brandId === b.id && p.stateCode === stateCode));

/** Great-circle distance in miles. */
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

export interface NearbyPlace {
  place: Place;
  miles: number;
}

/** Nearby places computed from verified coordinates in the dataset. */
export function getNearbyPlaces(place: Place, limit = 4, maxMiles = 250): NearbyPlace[] {
  if (place.lat === null || place.lng === null) return [];
  const { lat, lng } = place;
  return getMappablePlaces()
    .filter((p) => p.id !== place.id)
    .map((p) => ({ place: p as Place, miles: distanceMiles(lat, lng, p.lat, p.lng) }))
    .filter((n) => n.miles <= maxMiles)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Cities and localities
// ---------------------------------------------------------------------------

export const getPlaceGeo = (place: Place): PlaceGeo | undefined => placeGeo[place.id];

/** Official locality (city, town or CDP), else county, else the record's city. */
export function getLocality(place: Place): string {
  const g = placeGeo[place.id];
  return g?.locality ?? g?.county ?? place.city;
}

export const getCities = (): City[] => [...cities].sort(byName);
export const getCityBySlug = (slug: string) => cities.find((c) => c.slug === slug);

/** The city area a place belongs to, by the county its coordinates fall in. */
export function getCityForPlace(place: Place): City | undefined {
  const fips = placeGeo[place.id]?.countyFips;
  return fips ? cities.find((c) => c.stateCode === place.stateCode && c.countyFips.includes(fips)) : undefined;
}

export const getPlacesByCity = (city: City): Place[] =>
  sortedPlaces.filter((p) => getCityForPlace(p)?.id === city.id);

export const getCitiesByState = (stateCode: string): City[] =>
  getCities().filter((c) => c.stateCode === stateCode);

export interface LocalityCount {
  name: string;
  count: number;
}

/** Localities in a list of places, largest first. */
export function getLocalityBreakdown(list: Place[]): LocalityCount[] {
  const counts = new Map<string, number>();
  for (const p of list) {
    const name = getLocality(p);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const resolveCollectionPlaces = (c: Collection) => lookupMany(placeById, c.placeIds);

/** Collections are only published when they contain enough real places. */
export const getCollections = (): Collection[] =>
  collections
    .filter((c) => resolveCollectionPlaces(c).length >= MIN_COLLECTION_SIZE)
    .sort(byName);
export const getCollectionBySlug = (slug: string) =>
  getCollections().find((c) => c.slug === slug);
export const getCollectionPlaces = (c: Collection): Place[] => resolveCollectionPlaces(c);

// ---------------------------------------------------------------------------
// Images & sources
// ---------------------------------------------------------------------------

export const getImage = (id: string): ImageAsset | undefined => imageById.get(id);
export const getImages = (ids: string[]): ImageAsset[] => lookupMany(imageById, ids);
export const getSource = (id: string): Source | undefined => sourceById.get(id);
export const getSources = (ids: string[]): Source[] => lookupMany(sourceById, ids);

// ---------------------------------------------------------------------------
// Site-wide
// ---------------------------------------------------------------------------

export const getSiteCounts = () => ({
  placeTypes: placeTypes.length,
  brands: brands.length,
  places: places.length,
  fullProfiles: places.filter((p) => !isBasicListing(p)).length,
  listings: places.filter(isBasicListing).length,
  states: getStates().length,
  cities: cities.length,
  categories: getCategoriesWithData().length,
  collections: getCollections().length,
});
