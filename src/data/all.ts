/**
 * Every dataset in one place: hand-written records plus the imported
 * Wikidata listings, and the Census locality/county of each place.
 * Only data-access and the validator read this.
 */
import type { PlaceGeo } from '../types';
import geo from './geo/place-geo.json';
import { buildListings } from './imported';
import { images as fullImages } from './images';
import { places as fullPlaces } from './places';
import { placeTypes as fullPlaceTypes } from './placeTypes';
import { listingPlaceTypes } from './placeTypesListings';
import { sources as fullSources } from './sources';

/** Locality and county per place id (U.S. Census geocoder, see scripts/geo). */
export const placeGeo: Record<string, PlaceGeo> = (geo as { places: Record<string, PlaceGeo> }).places;

const listings = buildListings(new Set(fullPlaces.map((p) => p.slug)));

// Listings show the official locality from the Census geocoder, which is more
// consistent than Wikidata's "located in" values. Full profiles keep the city
// written for them.
const listingPlaces = listings.places.map((p) => {
  const g = placeGeo[p.id];
  return g ? { ...p, city: g.locality ?? g.county ?? p.city } : p;
});

export const allPlaceTypes = [...fullPlaceTypes, ...listingPlaceTypes];
export const allPlaces = [...fullPlaces, ...listingPlaces];
export const allImages = [...fullImages, ...listings.images];
export const allSources = [...fullSources, ...listings.sources];
