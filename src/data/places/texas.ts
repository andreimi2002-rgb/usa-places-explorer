import type { Place } from '../../types';
import { CHECKED, fact } from './helpers';

/** Verified place records for Texas. See docs/VERIFICATION.md for gaps. */
export const texasPlaces: Place[] = [
  {
    id: 'place-bucees-luling',
    slug: 'bucees-luling',
    name: "Buc-ee's Luling",
    placeTypeId: 'type-travel-center',
    brandId: 'brand-bucees',
    stateCode: 'TX',
    city: 'Luling',
    address: '10070 West IH 10, Luling, TX 78648',
    lat: null,
    lng: null,
    coordinatesSourceId: null,
    summary:
      "The site of Buc-ee's first travel center, rebuilt in 2024 as a 75,000-square-foot store that was the chain's largest when it opened.",
    sections: {
      overview: {
        body: "Luling, on Interstate 10 south of Austin, is where Buc-ee's first tried the travel center format in 2003. In 2024 the original store was replaced by a much larger one that, at opening, narrowly overtook the Sevierville, Tennessee store as the biggest Buc-ee's.",
      },
      facilities: {
        facts: [
          fact('Store number', '#17', 'src-bucees-locations'),
          fact('Store size', '75,000 sq ft (opened June 10, 2024)', 'src-wiki-bucees'),
          fact('Original store', '35,000 sq ft', 'src-wiki-bucees'),
        ],
      },
      fuel: {
        facts: [
          fact('Ethanol-free gasoline', '87 and 90 octane', 'src-bucees-locations'),
          fact('Diesel exhaust fluid (DEF)', 'Available', 'src-bucees-locations'),
        ],
      },
      history: {
        items: [
          "2003: Buc-ee's opens its first travel center in Luling",
          "June 10, 2024: the new 75,000 sq ft store opens, replacing the original 35,000 sq ft building",
        ],
      },
    },
    imageIds: ['img-bucees-luling-2008', 'img-bucees-luling-restrooms'],
    officialWebsite: 'https://buc-ees.com/locations/',
    featured: true,
    sourceIds: ['src-bucees-locations', 'src-wiki-bucees'],
    verificationStatus: 'partial',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-loves-italy-tx',
    slug: 'loves-italy-texas',
    name: "Love's Travel Stop, Italy, Texas",
    placeTypeId: 'type-travel-center',
    brandId: 'brand-loves',
    stateCode: 'TX',
    city: 'Italy',
    address: '1021 Dale Evans Dr, Italy, TX 76651',
    lat: 32.193688,
    lng: -96.898726,
    coordinatesSourceId: 'src-loves-italy-store',
    summary:
      "A typical modern Love's on Interstate 35E south of Dallas: a 24-hour stop built around truck parking, showers and truck service.",
    sections: {
      overview: {
        body: "This Love's on I-35E between Dallas and Waco shows the brand's trucker-first formula: alongside the store and fuel islands, its list of amenities reads like a checklist for professional drivers.",
      },
      fuel: {
        facts: [
          fact('DEF lanes', '8', 'src-loves-italy-store'),
          fact('Tesla Superchargers', '10', 'src-loves-italy-store'),
        ],
      },
      parking: {
        facts: [fact('Truck parking spaces', '110', 'src-loves-italy-store')],
        items: ['Overnight parking', 'RV-friendly parking', 'Dog park'],
      },
      facilities: {
        facts: [fact('Showers', '9', 'src-loves-italy-store'), fact('Store number', '#628', 'src-loves-italy-store')],
        items: ['CAT scales', 'Laundry', 'Truck tire services and light mechanical work', 'Commercial truck oil change'],
      },
      food: {
        items: ["Carl's Jr."],
      },
      access: {
        facts: [fact('Highway', 'Exit 386 on I-35E', 'src-loves-italy-store')],
      },
    },
    imageIds: ['img-loves-italy'],
    officialWebsite: 'https://www.loves.com/locations/tx/italy/loves-travel-stop-italy-628',
    featured: false,
    sourceIds: ['src-loves-italy-store'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-bass-pro-grapevine',
    slug: 'bass-pro-shops-grapevine',
    name: 'Bass Pro Shops Grapevine',
    placeTypeId: 'type-outdoor-superstore',
    brandId: 'brand-bass-pro-shops',
    stateCode: 'TX',
    city: 'Grapevine',
    address: '2501 Bass Pro Dr, Grapevine, TX 76051',
    lat: 32.957541,
    lng: -97.043583,
    coordinatesSourceId: 'src-osm-basspro-grapevine',
    summary:
      'A Dallas–Fort Worth outdoor superstore with a 30,000-gallon aquarium, wildlife mounts and indoor archery and shooting ranges.',
    sections: {
      overview: {
        body: "The Grapevine store, in the Dallas–Fort Worth area, shows how Bass Pro Shops turns a store into an outing. Visitors pass a lobby of hand-painted murals and record wildlife mounts on the way to the gear, and the aquarium and ranges give them reasons to linger.",
      },
      attractions: {
        facts: [fact('Aquarium', '30,000 gallons, stocked with native fish', 'src-basspro-grapevine-store')],
        items: ['3D archery range', 'Pistol range', 'Rifle range'],
      },
      architecture: {
        body: 'The entrance lobby features hand-painted murals, a large fireplace, and mounted state-record wildlife.',
      },
      facilities: {
        items: ["Bass Pro Shops / Cabela's Boating Center", 'Tracker Boats and marine departments'],
      },
    },
    imageIds: [],
    officialWebsite: 'https://stores.basspro.com/us/tx/grapevine/2501-bass-pro-dr.html',
    featured: false,
    sourceIds: ['src-basspro-grapevine-store', 'src-osm-basspro-grapevine'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-att-stadium',
    slug: 'att-stadium',
    name: 'AT&T Stadium',
    placeTypeId: 'type-sports-venue',
    brandId: null,
    stateCode: 'TX',
    city: 'Arlington',
    address: '1 AT&T Way, Arlington, TX',
    lat: 32.74769,
    lng: -97.09288,
    coordinatesSourceId: 'src-wd-att-stadium',
    summary:
      'Home of the Dallas Cowboys since 2009: a retractable-roof stadium that seats 80,000 and hosted matches at the 2026 FIFA World Cup.',
    sections: {
      overview: {
        body: 'Owned by the City of Arlington and nicknamed "Jerry World" after Cowboys owner Jerry Jones, the stadium was designed as a large entertainment venue rather than just a football field. Besides NFL games it hosts college bowls, concerts, basketball, rodeos and motocross.',
      },
      events: {
        items: [
          'Dallas Cowboys (NFL) home games',
          'Cotton Bowl Classic',
          'Big 12 Championship Game',
          '2026 FIFA World Cup matches, as one of 11 U.S. venues',
        ],
      },
      architecture: {
        facts: [
          fact('Seats', '80,000, expandable to over 100,000 with standing room', 'src-wiki-att-stadium'),
          fact('Roof', 'Retractable', 'src-wiki-att-stadium'),
          fact('Architect', 'HKS, Inc.', 'src-wiki-att-stadium'),
        ],
      },
      history: {
        facts: [
          fact('Built', '2006–2009', 'src-wiki-att-stadium'),
          fact('Opened', 'May 27, 2009', 'src-wd-att-stadium'),
          fact('Replaced', 'Texas Stadium, the Cowboys’ home from 1971 to 2008', 'src-wiki-att-stadium'),
        ],
      },
    },
    imageIds: ['img-att-stadium'],
    officialWebsite: 'https://attstadium.com/',
    featured: false,
    sourceIds: ['src-wiki-att-stadium', 'src-wd-att-stadium'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-fort-worth-stockyards',
    slug: 'fort-worth-stockyards',
    name: 'Fort Worth Stockyards',
    placeTypeId: 'type-historic-landmark',
    brandId: null,
    stateCode: 'TX',
    city: 'Fort Worth',
    address: null,
    lat: 32.788889,
    lng: -97.346667,
    coordinatesSourceId: 'src-wd-fw-stockyards',
    summary:
      'A historic district north of downtown Fort Worth built around a former livestock market, now a center of Western heritage, rodeo and nightlife.',
    sections: {
      overview: {
        body: 'A livestock market operated here under various owners from 1866. Today the old market district keeps its Western character, with brick buildings, saloons and western-wear stores, and volunteers still drive cattle through the streets.',
      },
      history: {
        facts: [
          fact('Livestock market', 'Operated under various owners from 1866', 'src-wiki-fw-stockyards'),
          fact('National Register of Historic Places', 'Listed June 29, 1976 (98-acre historic district)', 'src-wiki-fw-stockyards'),
        ],
      },
      architecture: {
        body: 'Recorded Texas Historic Landmarks in the district include the entrance sign, the Livestock Exchange Building and the Thannisch Block Building, home of the Stockyards Hotel.',
      },
      attractions: {
        items: ['Weekend rodeos at the Cowtown Coliseum', "Billy Bob's Texas and other Western bars and music venues", 'Cattle drives through the district, run by volunteers'],
      },
    },
    imageIds: ['img-fw-stockyards'],
    officialWebsite: 'https://www.fortworthstockyards.org/',
    featured: false,
    sourceIds: ['src-wiki-fw-stockyards', 'src-wd-fw-stockyards'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-port-of-houston',
    slug: 'port-of-houston',
    name: 'Port of Houston',
    placeTypeId: 'type-seaport',
    brandId: null,
    stateCode: 'TX',
    city: 'Houston',
    address: null,
    lat: 29.6111,
    lng: -95.0217,
    coordinatesSourceId: 'src-wd-port-houston',
    summary:
      'A 50-mile complex of public and private terminals along the Houston Ship Channel, tied to one of the largest petrochemical complexes in the world.',
    sections: {
      overview: {
        body: 'The Port of Houston is not one harbor but a long industrial corridor. Public terminals run by the port authority sit alongside more than 150 private companies on Buffalo Bayou and Galveston Bay, and many oil companies built refineries along the channel.',
      },
      cargo: {
        items: [
          'Containers, at the Barbours Cut and Bayport terminals',
          'Petroleum and petrochemicals, from refineries and plants along the channel',
          'Breakbulk, project and heavy-lift cargo at the Turning Basin Terminal',
        ],
      },
      operations: {
        facts: [
          fact('Length', 'About 50 miles of facilities', 'src-wiki-port-houston'),
          fact('Private companies along the channel', 'More than 150', 'src-wiki-port-houston'),
        ],
      },
      history: {
        facts: [
          fact('Officially opened', 'November 10, 1914, by President Woodrow Wilson', 'src-wiki-port-houston'),
          fact("Texas' first container terminal", 'Barbours Cut, opened 1977', 'src-wiki-port-houston'),
          fact('Bayport container terminal', 'Opened October 2006', 'src-wiki-port-houston'),
        ],
      },
    },
    imageIds: ['img-port-houston-barbours'],
    officialWebsite: 'https://porthouston.com/',
    featured: false,
    sourceIds: ['src-wiki-port-houston', 'src-wd-port-houston'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-space-center-houston',
    slug: 'space-center-houston',
    name: 'Space Center Houston',
    placeTypeId: 'type-space-center',
    brandId: null,
    stateCode: 'TX',
    city: 'Houston',
    address: '1601 NASA Parkway, Houston, TX 77058',
    lat: 29.5519,
    lng: -95.0983,
    coordinatesSourceId: 'src-wd-space-center-houston',
    summary:
      "The official visitor center of NASA's Johnson Space Center, home of Mission Control, with flown capsules and tours of the NASA campus.",
    sections: {
      overview: {
        body: 'Space Center Houston is a science museum run by a nonprofit foundation rather than by NASA, but its partnership with the Johnson Space Center lets visitors tour parts of the working campus where astronauts train and missions are controlled.',
      },
      exhibits: {
        facts: [fact('Space artifacts on display', 'More than 400', 'src-wiki-space-center-houston')],
        items: [
          'Flown capsules from Mercury 9, Gemini 5 and Apollo 17',
          'The only space shuttle that visitors can walk inside',
        ],
      },
      history: {
        facts: [
          fact('Opened', 'October 16, 1992', 'src-wiki-space-center-houston'),
          fact('Smithsonian Affiliate', 'Since 2014', 'src-wiki-space-center-houston'),
          fact('Operator', 'Manned Space Flight Education Foundation (nonprofit)', 'src-wiki-space-center-houston'),
          fact('Size', '250,000 sq ft', 'src-wiki-space-center-houston'),
        ],
      },
    },
    imageIds: ['img-space-center-houston'],
    officialWebsite: 'https://spacecenter.org/',
    featured: false,
    sourceIds: ['src-wiki-space-center-houston', 'src-wd-space-center-houston'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
];
