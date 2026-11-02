import type { Collection } from '../types';

/**
 * Curated groups of places that tell a larger story together. Intros are
 * editorial and make no factual claims beyond what each place page sources.
 * A collection is published only with at least MIN_COLLECTION_SIZE places.
 */
const base = { featured: false, createdAt: '2026-11-02' } as const;

export const collections: Collection[] = [
  {
    ...base,
    id: 'col-roadside-america',
    slug: 'roadside-america',
    name: 'Roadside America',
    intro: 'Concrete dinosaurs, wigwam motels, desert cafés and towns the highway left behind. These are the stops that turn a long drive into a story worth telling.',
    placeIds: [
      'place-cabazon-dinosaurs', 'place-wigwam-motel-holbrook', 'place-wd-Q7862894', 'place-wd-Q6842960',
      'place-slab-city', 'place-wd-Q458547', 'place-wd-Q139063', 'place-wd-Q849039',
    ],
    featured: true,
  },
  {
    ...base,
    id: 'col-wild-america',
    slug: 'wild-america',
    name: 'Wild America',
    intro: 'Canyons, deserts, swamps, islands and forests of giant trees. A tour of the national parks across the four states in the atlas so far.',
    placeIds: [
      'place-grand-canyon-national-park', 'place-wd-Q180402', 'place-everglades-national-park', 'place-wd-Q1427197',
      'place-wd-Q242111', 'place-wd-Q676206', 'place-wd-Q735202', 'place-wd-Q152660', 'place-wd-Q191824',
      'place-wd-Q1143655',
    ],
    featured: true,
  },
  {
    ...base,
    id: 'col-thrill-and-theme',
    slug: 'thrill-and-theme',
    name: 'Thrill & Theme',
    intro: 'From the giant Florida and California resorts to seaside boardwalks and regional coaster parks: where America goes to ride, scream and queue.',
    placeIds: [
      'place-disneyland-resort', 'place-universal-orlando-resort', 'place-wd-Q1207585', 'place-wd-Q2074361',
      'place-wd-Q2276588', 'place-wd-Q646122', 'place-wd-Q3472599', 'place-wd-Q595439', 'place-wd-Q1946237',
    ],
  },
  {
    ...base,
    id: 'col-working-america',
    slug: 'working-america',
    name: 'Working America',
    intro: 'Ports, airports, bridges and dams: the infrastructure that moves goods, people, water and power, and that is often a sight in its own right.',
    placeIds: [
      'place-port-of-los-angeles', 'place-port-of-houston', 'place-golden-gate-bridge', 'place-phoenix-sky-harbor',
      'place-wd-Q459096', 'place-wd-Q8731', 'place-wd-Q979378', 'place-wd-Q1972924', 'place-wd-Q3109025',
    ],
    featured: true,
  },
  {
    ...base,
    id: 'col-space-and-science',
    slug: 'space-and-science',
    name: 'Space & Science',
    intro: 'Spaceflight visitor centers, an air and space museum, a planetarium, a science academy and a research university: places to see how science and spaceflight work.',
    placeIds: [
      'place-kennedy-space-center-visitor-complex', 'place-space-center-houston', 'place-wd-Q3062422',
      'place-wd-Q85761246', 'place-wd-Q965731', 'place-wd-Q161562',
    ],
  },
  {
    ...base,
    id: 'col-old-west',
    slug: 'the-old-west',
    name: 'The Old West',
    intro: 'Cattle markets, frontier forts, territorial prisons and mining towns, some restored and some left to the desert. The places behind the legends of the West.',
    placeIds: [
      'place-fort-worth-stockyards', 'place-wd-Q6411977', 'place-wd-Q832945', 'place-wd-Q526354',
      'place-wd-Q4915840', 'place-wd-Q3077790', 'place-wd-Q1128074', 'place-wd-Q1687755', 'place-wd-Q982241',
    ],
  },
  {
    ...base,
    id: 'col-spanish-colonial',
    slug: 'spanish-colonial-america',
    name: 'Spanish Colonial America',
    intro: 'Missions, presidios and stone forts from the centuries when Spain ruled much of what is now the American South and West. That history includes the forced labor and deaths of many Indigenous people, as the California Mission page explains.',
    placeIds: [
      'place-wd-Q101094405', 'place-wd-Q5582298', 'place-wd-Q7241535', 'place-wd-Q7241536',
      'place-wd-Q617891', 'place-wd-Q2689743', 'place-wd-Q1413807', 'place-wd-Q1939057',
    ],
  },
  {
    ...base,
    id: 'col-lights-and-piers',
    slug: 'lights-and-piers',
    name: 'Lights & Piers',
    intro: 'Lighthouses that have guided ships along the Atlantic, Gulf and Pacific coasts, and the piers where people walk out over the water today.',
    placeIds: [
      'place-wd-Q779685', 'place-wd-Q7193314', 'place-wd-Q7587188', 'place-wd-Q3378203', 'place-wd-Q7207966',
      'place-wd-Q14683250', 'place-wd-Q595439',
    ],
  },
  {
    ...base,
    id: 'col-grand-hotels',
    slug: 'grand-hotels',
    name: 'Grand Hotels',
    intro: 'Beachfront palaces, canyon-rim lodges and the downtown hotels that once defined their cities. Places worth seeing even if you are not checking in.',
    placeIds: [
      'place-wd-Q1631096', 'place-wd-Q979133', 'place-wd-Q2159261', 'place-wd-Q5307819', 'place-wd-Q6816982',
      'place-wd-Q1435790', 'place-wd-Q1559342', 'place-wd-Q2914712',
    ],
  },
  {
    ...base,
    id: 'col-retail-giants',
    slug: 'retail-giants',
    name: 'Retail Giants',
    intro: 'Shopping on an American scale: oversized travel centers, an outdoor superstore, luxury malls and a historic farmers market.',
    placeIds: [
      'place-bucees-daytona-beach', 'place-loves-italy-tx', 'place-bass-pro-grapevine', 'place-south-coast-plaza',
      'place-wd-Q3141392', 'place-wd-Q7738393', 'place-wd-Q5435793',
    ],
  },
];
