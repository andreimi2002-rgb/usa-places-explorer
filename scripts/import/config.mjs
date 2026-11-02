/**
 * What the Wikidata import brings in. Each group maps one or more Wikidata
 * classes ("instance of") to a place type in src/data/placeTypes.ts.
 *
 * Only items with coordinates, an English Wikipedia article and a Commons
 * photo are taken, ranked by how many Wikipedia language editions cover them
 * (a simple notability signal), and capped per state.
 */

export const IMPORT_DATE = '2026-11-02';

export const STATES = [
  { code: 'FL', qid: 'Q812' },
  { code: 'TX', qid: 'Q1439' },
  { code: 'AZ', qid: 'Q816' },
  { code: 'CA', qid: 'Q99' },
];

/** typeId (without the "type-" prefix) → Wikidata classes, cap per state, min. sitelinks. */
export const GROUPS = [
  // Nature & wildlife
  { typeId: 'national-park', classes: ['Q34918903'], cap: 20 },
  { typeId: 'national-monument', classes: ['Q893775'], cap: 12 },
  { typeId: 'state-park', classes: ['Q28399100', 'Q37989229', 'Q38001316', 'Q37944886', 'Q16023747'], cap: 15 },
  { typeId: 'wildlife-refuge', classes: ['Q1410668'], cap: 8 },
  { typeId: 'garden-aquarium', classes: ['Q2281788', 'Q167346'], cap: 10 },
  { typeId: 'zoo', classes: ['Q43501'], cap: 8 },
  { typeId: 'natural-spring', classes: ['Q124714'], cap: 8 },
  { typeId: 'cave', classes: ['Q35509'], cap: 6 },
  // History & culture
  { typeId: 'museum', classes: ['Q33506', 'Q588140', 'Q18704634', 'Q2087181'], cap: 15 },
  { typeId: 'art-museum', classes: ['Q207694'], cap: 10 },
  { typeId: 'spanish-mission', classes: ['Q1824509'], cap: 21 },
  { typeId: 'historic-fort', classes: ['Q1785071'], cap: 8 },
  { typeId: 'ghost-town', classes: ['Q74047'], cap: 12 },
  // Travel, hospitality, food, entertainment
  { typeId: 'lighthouse', classes: ['Q39715'], cap: 12 },
  { typeId: 'landmark-hotel', classes: ['Q27686'], cap: 15 },
  { typeId: 'landmark-restaurant', classes: ['Q11707', 'Q1226318', 'Q18355750'], cap: 12 },
  { typeId: 'amusement-park', classes: ['Q194195'], cap: 10 },
  { typeId: 'pier', classes: ['Q863454'], cap: 10 },
  { typeId: 'performing-arts-venue', classes: ['Q24354', 'Q153562', 'Q54831'], cap: 12 },
  { typeId: 'sports-venue', classes: ['Q483110'], cap: 12, minSitelinks: 5 },
  { typeId: 'airport', classes: ['Q644371'], cap: 8 },
  { typeId: 'landmark-bridge', classes: ['Q12280'], cap: 8, minSitelinks: 4 },
  { typeId: 'regional-mall', classes: ['Q11315', 'Q31374404'], cap: 8, minSitelinks: 2 },
  // Work, land and learning
  { typeId: 'dam', classes: ['Q12323'], cap: 8 },
  { typeId: 'winery', classes: ['Q156362'], cap: 15 },
  { typeId: 'ranch', classes: ['Q509028'], cap: 8 },
  { typeId: 'university', classes: ['Q3918'], cap: 10 },
];

/** Items Wikidata gets wrong for our purposes; never imported. */
export const EXCLUDED = {
  Q601596: 'Texas Stadium: demolished in 2010, but Wikidata has no end date',
  Q4966209: 'Bridge Canyon Dam: proposed, never built',
  Q815352: 'California State University: a university system, not a single campus',
};
