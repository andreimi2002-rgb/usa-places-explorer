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
  Q7449543: 'Seminole Towne Center: mall closed at the end of January 2025',
  Q24256820: 'Skeletons: Animals Unveiled: Wikipedia link goes to a different museum in Oklahoma City',
  Q8026222: 'Winter Garden Heritage Foundation: an organization, not a single place to visit',
  Q5263955: 'Desert Inn and Restaurant: demolished on September 5, 2024',
  Q7452662: 'Seralago Hotel: no longer operating',
  Q5461246: 'Florida Carriage Museum: renamed Grand Oaks Museum when the property was sold in 2011',
  Q7978973: 'Webster University Orlando: an extended campus office, not a place to visit',
  Q7570535: 'Southern Technical College: multi-campus for-profit college, not a place to visit',
  Q3248109: 'Wet n Wild Orlando: closed on January 1, 2017',
  Q3038335: 'Pleasure Island: no longer a separate area; now part of Disney Springs',
  Q5655372: 'Hard Rock Live: Wikidata links this Orlando point to the article about the Hollywood, Florida venue',
  Q4784900: 'UCF Arboretum: Wikipedia link redirects to the university article',
  Q14685970: 'Hindu University of America: unaccredited school, not a place to visit',
  Q5461672: 'Florida Technical College: multi-campus for-profit college, not a place to visit',
  Q601596: 'Texas Stadium: demolished in 2010, but Wikidata has no end date',
  Q4966209: 'Bridge Canyon Dam: proposed, never built',
  Q815352: 'California State University: a university system, not a single campus',
  Q2777866: 'DisneyQuest: closed in 2017, but Wikidata has no end date',
  Q793493: 'Azalea Park: a residential census-designated place, not a place to visit',
  Q2429132: 'Conway: a residential census-designated place, not a place to visit',
  Q2570546: 'Holden Heights: a residential census-designated place, not a place to visit',
};

/**
 * Regions imported in depth: every notable place, with no cap per type.
 * "Notable" = has an English Wikipedia article, and either is a visitor-facing
 * type (`visitorTypes`) or is covered by at least `minSitelinks` Wikipedia
 * language editions. This keeps out residential districts, minor stations
 * and similar entries that only matter locally.
 */
export const REGIONS = [
  {
    id: 'orlando',
    state: 'FL',
    // Orlando–Kissimmee–Sanford metro area: Lake, Orange, Osceola, Seminole counties.
    countyFips: ['12069', '12095', '12097', '12117'],
    box: [27.6, 29.3, -82.05, -80.85],
    minSitelinks: 2,
    visitorTypes: [
      'theme-park', 'water-park', 'amusement-park', 'landmark-hotel', 'landmark-restaurant', 'sports-venue',
      'performing-arts-venue', 'convention-center', 'museum', 'art-museum', 'regional-mall', 'city-park',
      'garden-aquarium', 'zoo', 'state-park', 'national-park', 'national-monument', 'wildlife-refuge',
    ],
  },
];

/**
 * Extra classes for in-depth regions, on top of GROUPS (which run uncapped
 * there). `first: true` groups are matched before GROUPS, so a theme park is
 * not filed as a generic amusement park, nor a resort hotel as a convention center.
 */
export const REGION_GROUPS = [
  { typeId: 'theme-park', classes: ['Q2416723'], first: true },
  { typeId: 'water-park', classes: ['Q740326'], first: true },
  { typeId: 'landmark-hotel', classes: ['Q27686', 'Q875157'], first: true },
  { typeId: 'garden-aquarium', classes: ['Q2281788', 'Q167346'], first: true },
  { typeId: 'lake', classes: ['Q23397'] },
  { typeId: 'city-park', classes: ['Q22746', 'Q22698'] },
  { typeId: 'neighborhood', classes: ['Q123705', 'Q15243209'] },
  { typeId: 'convention-center', classes: ['Q1378975'] },
  { typeId: 'train-station', classes: ['Q55488', 'Q22808404'] },
  { typeId: 'sports-venue', classes: ['Q641226', 'Q595452', 'Q1076486'] },
  { typeId: 'performing-arts-venue', classes: ['Q3469910', 'Q1060829', 'Q57660343'] },
  { typeId: 'university', classes: ['Q189004'] },
];
