/**
 * Every dataset in one place: hand-written records plus the imported
 * Wikidata listings. Only data-access and the validator read this.
 */
import { buildListings } from './imported';
import { images as fullImages } from './images';
import { places as fullPlaces } from './places';
import { placeTypes as fullPlaceTypes } from './placeTypes';
import { listingPlaceTypes } from './placeTypesListings';
import { sources as fullSources } from './sources';

const listings = buildListings(new Set(fullPlaces.map((p) => p.slug)));

export const allPlaceTypes = [...fullPlaceTypes, ...listingPlaceTypes];
export const allPlaces = [...fullPlaces, ...listings.places];
export const allImages = [...fullImages, ...listings.images];
export const allSources = [...fullSources, ...listings.sources];
