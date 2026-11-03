/**
 * Core data model for USA Places Explorer.
 *
 * Rule of thumb: any factual field that could not be verified is `null`.
 * The UI is responsible for hiding or labelling null fields — never for
 * filling them in.
 */

/** ISO calendar date, e.g. "2026-11-01". */
export type ISODate = string;

export type VerificationStatus = 'verified' | 'partial' | 'unverified';

/** Shared by every entity that presents facts. */
export interface Verifiable {
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  lastVerified: ISODate | null;
}

/**
 * A single fact that must be shown with its source and "as of" date
 * (e.g. number of locations). If `value` is null the fact is unknown.
 */
export interface SourcedValue<T> {
  value: T | null;
  sourceId: string | null;
  asOf: ISODate | null;
  /** Optional short qualifier, e.g. "in 42 states". */
  note?: string;
  /** For numbers the source gives as "more than 900" or "nearly 200". */
  approximate?: 'more-than' | 'nearly';
}

/** Name of a Lucide icon registered in `src/components/ui/icons.ts`. */
export type IconName =
  | 'map'
  | 'shopping-bag'
  | 'fuel'
  | 'utensils'
  | 'trophy'
  | 'trees'
  | 'ferris-wheel'
  | 'home'
  | 'plane'
  | 'landmark'
  | 'graduation-cap'
  | 'bed'
  | 'wheat'
  | 'factory'
  | 'sparkles';

// ---------------------------------------------------------------------------
// Sources & images
// ---------------------------------------------------------------------------

export type SourceKind =
  | 'official'
  | 'government'
  | 'wikidata'
  | 'wikipedia'
  | 'news'
  | 'openstreetmap'
  | 'other';

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: SourceKind;
  /** Date the page was fetched and checked. */
  accessed: ISODate;
}

export type ImageLicense =
  | 'CC0'
  | 'Public domain'
  | 'Attribution'
  | 'CC BY 2.0'
  | 'CC BY 2.5'
  | 'CC BY 3.0'
  | 'CC BY 4.0'
  | 'CC BY-SA 2.0'
  | 'CC BY-SA 2.5'
  | 'CC BY-SA 3.0'
  | 'CC BY-SA 4.0';

/** A Wikimedia Commons image whose file page was actually fetched. */
export interface ImageAsset {
  id: string;
  /** Direct image URL on upload.wikimedia.org. */
  fileUrl: string;
  /** The Commons "File:" page. */
  commonsPageUrl: string;
  alt: string;
  caption: string | null;
  author: string;
  authorUrl: string | null;
  license: ImageLicense;
  licenseUrl: string | null;
  width: number | null;
  height: number | null;
  retrieved: ISODate;
  /**
   * False when nobody has yet checked by eye that the photo shows the place
   * (imported listings). Absent means checked.
   */
  reviewed?: boolean;
}

// ---------------------------------------------------------------------------
// Geography & taxonomy
// ---------------------------------------------------------------------------

export interface State {
  /** USPS code, e.g. "TX". Used as the foreign key on places. */
  code: string;
  slug: string;
  name: string;
  /** Short editorial intro in our own words. No statistics. */
  intro: string;
  heroImageId: string | null;
  /** Whether the state is part of the current published scope. */
  active: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Editorial description in our own words. */
  description: string;
  icon: IconName;
  order: number;
}

// ---------------------------------------------------------------------------
// Place types
// ---------------------------------------------------------------------------

/**
 * Keys of the type-specific blocks a place page can show.
 * Labels/icons live in `src/config/place-sections.ts`; each PlaceType lists
 * which keys apply to it and in what order.
 */
export type PlaceSectionKey =
  | 'overview'
  | 'facilities'
  | 'fuel'
  | 'parking'
  | 'food'
  | 'parks'
  | 'hotels'
  | 'attractions'
  | 'landscape'
  | 'wildlife'
  | 'visitorCenters'
  | 'cargo'
  | 'operations'
  | 'architecture'
  | 'exhibits'
  | 'events'
  | 'history'
  | 'community'
  | 'access';

export interface SectionFact {
  label: string;
  value: string;
  sourceId: string | null;
  asOf: ISODate | null;
}

export interface PlaceSection {
  /** Our own words. */
  body?: string;
  facts?: SectionFact[];
  /** Short bullet list (e.g. amenities). */
  items?: string[];
}

export type PlaceSections = Partial<Record<PlaceSectionKey, PlaceSection>>;

export interface AnatomyItem {
  title: string;
  description: string;
}

/** Comparison table on a place type page, e.g. travel center vs truck stop. */
export interface ComparisonTable {
  caption: string;
  /** Column headers, starting with the type itself. */
  columns: string[];
  rows: { aspect: string; values: string[] }[];
}

export interface PlaceType extends Verifiable {
  id: string;
  slug: string;
  name: string;
  /** Plural form for headings, e.g. "Travel Centers". */
  pluralName: string;
  categoryId: string;
  /** One-sentence summary for cards and meta descriptions. */
  summary: string;
  /** "What it is" — paragraphs in our own words. */
  definition: string[];
  comparison: ComparisonTable | null;
  anatomy: AnatomyItem[];
  /** "Where it is common" — paragraphs. */
  whereCommon: string[];
  relatedTypeIds: string[];
  /** Ordered section config for place pages of this type. */
  sectionKeys: PlaceSectionKey[];
  imageIds: string[];
  featured: boolean;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export interface Brand extends Verifiable {
  id: string;
  slug: string;
  name: string;
  placeTypeIds: string[];
  summary: string;
  /** "What makes it distinctive" — paragraphs. */
  distinctive: string[];
  founded: SourcedValue<number>;
  headquarters: SourcedValue<string>;
  /** What a "location" is for this brand, e.g. "Locations", "Warehouses". */
  locationLabel: string;
  /** Count in the United States. */
  locationsUS: SourcedValue<number>;
  /** Count across all countries; null when the brand is U.S.-only or no figure exists. */
  locationsWorldwide: SourcedValue<number> | null;
  officialWebsite: string | null;
  wikidataId: string | null;
  relatedBrandIds: string[];
  imageIds: string[];
  featured: boolean;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

/**
 * "full": a hand-written profile with type-specific sections.
 * "basic": an imported listing built from Wikidata, with template text only.
 */
export type PlaceProfile = 'full' | 'basic';

export interface Place extends Verifiable {
  id: string;
  slug: string;
  name: string;
  placeTypeId: string;
  brandId: string | null;
  stateCode: string;
  city: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** Where the coordinates come from (Wikidata, official site or OpenStreetMap). */
  coordinatesSourceId: string | null;
  summary: string;
  sections: PlaceSections;
  imageIds: string[];
  officialWebsite: string | null;
  featured: boolean;
  createdAt: ISODate;
  /** Defaults to "full". */
  profile?: PlaceProfile;
  /**
   * For basic listings: "written" when the summary was written for the atlas
   * from the Wikipedia lead, "generated" when it is the template sentence.
   */
  summaryKind?: 'written' | 'generated';
  wikidataId?: string | null;
  /**
   * Ordering signal for listings: the number of Wikipedia language editions
   * that cover the place (from Wikidata). Not shown as a fact.
   */
  rank?: number;
}

// ---------------------------------------------------------------------------
// Cities (metro areas)
// ---------------------------------------------------------------------------

/**
 * A city area: the metro area around a principal city, defined by its
 * counties. Places belong to it by the county their coordinates fall in.
 */
export interface City {
  id: string;
  slug: string;
  /** Short name, e.g. "Orlando". */
  name: string;
  /** Area name, e.g. "Greater Orlando". */
  areaName: string;
  stateCode: string;
  /** Editorial intro in our own words. */
  intro: string;
  /** County FIPS codes that make up the area (official metro definition). */
  countyFips: string[];
  countyNames: string[];
  population: SourcedValue<number>;
  areaSqMi: SourcedValue<number>;
  /** Map view. */
  center: { lat: number; lng: number; zoom: number };
  heroImageId: string | null;
  sourceIds: string[];
  createdAt: ISODate;
}

/** Official locality and county for a place, from the Census geocoder. */
export interface PlaceGeo {
  locality: string | null;
  localityKind: 'incorporated' | 'cdp' | null;
  county: string | null;
  countyFips: string | null;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export interface Collection {
  id: string;
  slug: string;
  name: string;
  /** Short editorial intro. */
  intro: string;
  placeIds: string[];
  /** Optional one-line note per place id: why it belongs here. Our own words. */
  notes?: Record<string, string>;
  featured: boolean;
  createdAt: ISODate;
}

/** Minimum number of real places a collection needs before it is shown. */
export const MIN_COLLECTION_SIZE = 3;
