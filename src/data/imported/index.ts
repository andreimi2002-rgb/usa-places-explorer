/**
 * Turns the imported Wikidata records (listings.json, built by
 * scripts/import/wikidata-listings.mjs) into atlas places, photos and sources.
 *
 * Text here is template-only: type, location and Wikidata facts. Nothing is
 * paraphrased from articles, so no listing claims more than its sources say.
 */
import type { ImageAsset, ImageLicense, Place, Source } from '../../types';
import statewide from './listings.json';
import orlando from './region-orlando.json';
import osmOrlando from './osm-brands-orlando.json';
import facts from './facts.json';
import summaries from './summaries.json';
import { photoReview } from './photo-review';

/** Summaries written for the atlas from each Wikipedia lead. */
const written = (summaries as { summaries: Record<string, string> }).summaries;

/** Extra facts per Wikidata ID (scripts/import/wikidata-facts.mjs). */
const wikidataFacts = facts as Record<string, { label: string; value: string; asOfYear?: number }[]>;

interface ListingRecord {
  qid: string;
  name: string;
  typeId: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  sitelinks: number;
  wikipedia: string;
  year: number | null;
  website: string | null;
  address: string | null;
  nrhp: boolean;
  region?: string;
  image: {
    fileUrl: string;
    commonsPageUrl: string;
    author: string;
    authorUrl: string | null;
    license: string;
    licenseUrl: string | null;
    width: number;
    height: number;
  } | null;
}

type ListingFile = { importedOn: string; records: ListingRecord[] };

interface OsmBrandRecord {
  osm: string;
  brandId: string;
  typeId: string;
  name: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  address: string | null;
  website: string | null;
}
type OsmFile = { importedOn: string; records: OsmBrandRecord[] };

/** Statewide listings plus in-depth regions (Greater Orlando). */
const files = [statewide, orlando] as ListingFile[];
const records = files.flatMap((f) => f.records.map((r) => ({ ...r, importedOn: f.importedOn })));

const STATE_NAMES: Record<string, string> = { FL: 'Florida', TX: 'Texas', AZ: 'Arizona', CA: 'California' };

/** How the Wikidata "inception" date reads for each type. */
const INCEPTION: Record<string, string> = {
  'national-park': 'Established', 'national-monument': 'Established', 'state-park': 'Established',
  'wildlife-refuge': 'Established', 'garden-aquarium': 'Established', zoo: 'Established', ranch: 'Established',
  museum: 'Founded', 'art-museum': 'Founded', 'spanish-mission': 'Founded', 'ghost-town': 'Founded',
  winery: 'Founded', university: 'Founded',
  'amusement-park': 'Opened', airport: 'Opened', 'regional-mall': 'Opened',
  lighthouse: 'Built', 'historic-fort': 'Built', dam: 'Built', 'landmark-bridge': 'Built', pier: 'Built',
};

/** Lower-case type noun for sentences, keeping proper names. */
const TYPE_NOUNS: Record<string, string> = {
  'national-park': 'national park', 'national-monument': 'national monument', 'state-park': 'state park',
  'wildlife-refuge': 'national wildlife refuge', 'garden-aquarium': 'public garden or aquarium', zoo: 'zoo',
  'natural-spring': 'natural spring', cave: 'cave', museum: 'museum', 'art-museum': 'art museum',
  'spanish-mission': 'Spanish mission', 'historic-fort': 'historic fort', 'ghost-town': 'ghost town',
  lighthouse: 'lighthouse', 'landmark-hotel': 'landmark hotel', 'landmark-restaurant': 'landmark restaurant',
  'amusement-park': 'amusement park', pier: 'pier', 'performing-arts-venue': 'performing arts venue',
  'sports-venue': 'sports venue', airport: 'international airport', 'landmark-bridge': 'bridge',
  'regional-mall': 'shopping center', dam: 'dam', winery: 'winery', ranch: 'ranch', university: 'university',
};

const article = (noun: string) => (/^[aeiou]/i.test(noun) ? 'An' : 'A');

const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
    .replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const wdSourceId = (qid: string) => `src-wd-${qid}`;
const wpSourceId = (qid: string) => `src-wp-${qid}`;
export const listingImageId = (qid: string) => `img-wd-${qid}`;

export function buildListings(takenSlugs: Set<string>) {
  const places: Place[] = [];
  const images: ImageAsset[] = [];
  const sources: Source[] = [];
  const slugs = new Set(takenSlugs);

  const uniqueSlug = (r: ListingRecord) => {
    for (const candidate of [
      slugify(r.name),
      slugify(`${r.name} ${r.city}`),
      slugify(`${r.name} ${r.city} ${r.state}`),
      slugify(`${r.name} ${r.qid}`),
    ]) {
      if (candidate && !slugs.has(candidate)) {
        slugs.add(candidate);
        return candidate;
      }
    }
    throw new Error(`No free slug for ${r.qid}`);
  };

  for (const r of records) {
    const stateName = STATE_NAMES[r.state] ?? r.state;
    const noun = TYPE_NOUNS[r.typeId] ?? 'place';
    const verb = INCEPTION[r.typeId];
    const yearClause = r.year ? `, ${verb ? verb.toLowerCase() + ' in' : 'dating from'} ${r.year}` : '';

    sources.push(
      {
        id: wdSourceId(r.qid), title: `${r.name} (${r.qid})`, publisher: 'Wikidata',
        url: `https://www.wikidata.org/wiki/${r.qid}`, kind: 'wikidata', accessed: r.importedOn,
      },
      {
        id: wpSourceId(r.qid), title: r.wikipedia, publisher: 'Wikipedia',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.wikipedia.replace(/ /g, '_'))}`,
        kind: 'wikipedia', accessed: r.importedOn,
      },
    );

    const facts = [];
    const extra = wikidataFacts[r.qid] ?? [];
    // An exact opening date from Wikidata beats the bare inception year.
    const hasExactOpening = extra.some((x) => x.label === 'Opened');
    if (r.year && !(hasExactOpening && verb === 'Opened')) {
      facts.push({ label: verb ?? 'Dates from', value: String(r.year), sourceId: wdSourceId(r.qid), asOf: r.importedOn });
    }
    for (const x of extra) {
      facts.push({ label: x.label, value: x.value, sourceId: wdSourceId(r.qid), asOf: x.asOfYear ? `${x.asOfYear}-12-31` : r.importedOn });
    }
    if (r.nrhp) facts.push({ label: 'National Register of Historic Places', value: 'Listed', sourceId: wdSourceId(r.qid), asOf: r.importedOn });

    const rejected = photoReview.rejected[r.qid];
    const hasPhoto = r.image && !rejected;
    if (r.image && hasPhoto) {
      images.push({
        id: listingImageId(r.qid),
        fileUrl: r.image.fileUrl,
        commonsPageUrl: r.image.commonsPageUrl,
        alt: r.name,
        caption: null,
        author: r.image.author,
        authorUrl: r.image.authorUrl,
        license: r.image.license as ImageLicense,
        licenseUrl: r.image.licenseUrl,
        width: r.image.width,
        height: r.image.height,
        retrieved: r.importedOn,
        reviewed: photoReview.reviewed.has(r.qid),
      });
    }

    places.push({
      id: `place-wd-${r.qid}`,
      slug: uniqueSlug(r),
      name: r.name,
      placeTypeId: `type-${r.typeId}`,
      brandId: null,
      stateCode: r.state,
      city: r.city,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      coordinatesSourceId: wdSourceId(r.qid),
      summary: written[r.qid] ?? `${article(noun)} ${noun} in ${r.city}, ${stateName}${yearClause}.`,
      summaryKind: written[r.qid] ? 'written' : 'generated',
      sections: facts.length ? { overview: { facts } } : {},
      imageIds: hasPhoto ? [listingImageId(r.qid)] : [],
      officialWebsite: r.website,
      featured: false,
      createdAt: r.importedOn,
      sourceIds: [wpSourceId(r.qid), wdSourceId(r.qid)],
      verificationStatus: 'partial',
      lastVerified: r.importedOn,
      profile: 'basic',
      wikidataId: r.qid,
      rank: r.sitelinks,
    });
  }

  // Brand locations from OpenStreetMap (city areas only).
  const BRAND_NOUNS: Record<string, [string, string]> = {
    'warehouse-club': ['Costco', 'warehouse club'],
    'outdoor-superstore': ['Bass Pro Shops', 'outdoor superstore'],
    'travel-center': ['', 'travel center'],
  };
  for (const file of [osmOrlando] as OsmFile[]) {
    for (const r of file.records) {
      const sourceId = `src-osm-${r.osm.replace('/', '-')}`;
      sources.push({
        id: sourceId, title: `${r.name} (${r.osm})`, publisher: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/${r.osm}`, kind: 'openstreetmap', accessed: file.importedOn,
      });
      const noun = BRAND_NOUNS[r.typeId]?.[1] ?? 'location';
      const brandName = r.name.split(' ').slice(0, r.typeId === 'outdoor-superstore' ? 3 : 1).join(' ');
      const stateName = STATE_NAMES[r.state] ?? r.state;
      const base = slugify(r.name);
      let slug = base;
      for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;
      slugs.add(slug);
      places.push({
        id: `place-osm-${r.osm.replace('/', '-')}`,
        slug,
        name: r.name,
        placeTypeId: `type-${r.typeId}`,
        brandId: r.brandId,
        stateCode: r.state,
        city: r.city,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        coordinatesSourceId: sourceId,
        summary: `${article(brandName)} ${brandName} ${noun} in ${r.city}, ${stateName}.`,
        sections: {},
        imageIds: [],
        officialWebsite: r.website,
        featured: false,
        createdAt: file.importedOn,
        sourceIds: [sourceId],
        verificationStatus: 'partial',
        lastVerified: file.importedOn,
        profile: 'basic',
        wikidataId: null,
        rank: 0,
      });
    }
  }

  return { places, images, sources };
}
