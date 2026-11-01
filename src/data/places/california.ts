import type { Place } from '../../types';
import { CHECKED, fact } from './helpers';

/** Verified place records for California. See docs/VERIFICATION.md for gaps. */
export const californiaPlaces: Place[] = [
  {
    id: 'place-disneyland-resort',
    slug: 'disneyland-resort',
    name: 'Disneyland Resort',
    placeTypeId: 'type-theme-park-resort',
    brandId: 'brand-disney-parks',
    stateCode: 'CA',
    city: 'Anaheim',
    address: null,
    lat: 33.811111,
    lng: -117.918889,
    coordinatesSourceId: 'src-wd-disneyland-resort',
    summary:
      'The resort that grew around the original Disneyland of 1955, now with two theme parks, three hotels and the Downtown Disney district.',
    sections: {
      overview: {
        body: 'When Disneyland opened in 1955 the property was little more than the park, its parking lot and a hotel owned by a business partner. After the multi-park model proved itself at Walt Disney World, Disney bought the land around Disneyland and rebuilt it as a resort, adding a second park, hotels and a shopping district in 2001.',
      },
      parks: {
        facts: [
          fact('Disneyland', 'Opened July 17, 1955', 'src-wiki-disneyland-resort'),
          fact('Disney California Adventure', 'Opened 2001', 'src-wiki-disneyland-resort'),
        ],
      },
      hotels: {
        facts: [fact('Hotels', '3', 'src-wiki-disneyland-resort')],
        items: [
          'Disneyland Hotel, bought by Disney in 1988',
          'Pixar Place Hotel, the former Pan Pacific Hotel bought in 1995',
          'Grand Californian Hotel, opened 2001',
        ],
      },
      attractions: {
        items: ['Downtown Disney, a shopping, dining and entertainment district opened in 2001'],
      },
      history: {
        facts: [fact('Land owned by Disney', '489 acres', 'src-wiki-disneyland-resort')],
      },
    },
    imageIds: ['img-disneyland-castle'],
    officialWebsite: 'https://disneyland.disney.go.com/',
    featured: true,
    sourceIds: ['src-wiki-disneyland-resort', 'src-wd-disneyland-resort'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-golden-gate-bridge',
    slug: 'golden-gate-bridge',
    name: 'Golden Gate Bridge',
    placeTypeId: 'type-landmark-bridge',
    brandId: null,
    stateCode: 'CA',
    city: 'San Francisco',
    address: null,
    lat: 37.819722222222,
    lng: -122.47861111111,
    coordinatesSourceId: 'src-wd-golden-gate',
    summary:
      'The International Orange suspension bridge across the Golden Gate strait, which was the longest and tallest suspension bridge in the world when it opened in 1937.',
    sections: {
      overview: {
        body: 'The bridge spans the strait between San Francisco Bay and the Pacific Ocean, linking San Francisco with Marin County. It carries U.S. Route 101 and California State Route 1 as well as people on foot and bicycle, and it has become one of the defining symbols of California.',
      },
      architecture: {
        facts: [
          fact('Type', 'Suspension bridge', 'src-wiki-golden-gate'),
          fact('Main span', '4,200 ft (1,280 m)', 'src-wiki-golden-gate'),
          fact('Height', '746 ft (227 m)', 'src-wiki-golden-gate'),
          fact('Total length', '8,980 ft (about 1.7 mi)', 'src-wiki-golden-gate'),
        ],
        body: 'Its color, an orange vermilion called International Orange, was chosen by consulting architect Irving Morrow to complement the setting and keep the bridge visible in fog.',
      },
      history: {
        facts: [
          fact('Opened', 'May 27, 1937', 'src-wd-golden-gate'),
          fact('Chief engineer', 'Joseph Strauss', 'src-wiki-golden-gate'),
          fact('Records at opening', 'Longest and tallest suspension bridge in the world', 'src-wiki-golden-gate'),
        ],
      },
      access: {
        items: ['U.S. Route 101 and California State Route 1', 'Pedestrian and bicycle access (part of U.S. Bicycle Route 95)'],
      },
    },
    imageIds: ['img-golden-gate'],
    officialWebsite: 'https://www.goldengate.org/bridge/',
    featured: true,
    sourceIds: ['src-wiki-golden-gate', 'src-wd-golden-gate'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-port-of-los-angeles',
    slug: 'port-of-los-angeles',
    name: 'Port of Los Angeles',
    placeTypeId: 'type-seaport',
    brandId: null,
    stateCode: 'CA',
    city: 'Los Angeles (San Pedro and Wilmington)',
    address: null,
    lat: 33.7291858,
    lng: -118.262015,
    coordinatesSourceId: 'src-wd-port-la',
    summary:
      "The country's busiest container port, a city-run harbor on San Pedro Bay that sits beside the separate Port of Long Beach.",
    sections: {
      overview: {
        body: 'Run by the Los Angeles Harbor Department, a unit of the City of Los Angeles, the port spreads across the San Pedro and Wilmington neighborhoods about 20 miles south of downtown. It adjoins the separate Port of Long Beach, and its biggest trading partners are in Asia.',
      },
      cargo: {
        facts: [fact('U.S. rank', 'Busiest port by container volume', 'src-wiki-port-la')],
        body: 'Typical top imports are furniture, automobile parts, apparel, footwear and electronics. In 2020 its top trading partners were China (including Hong Kong), Japan and Vietnam.',
      },
      operations: {
        facts: [
          fact('Area', '7,500 acres of land and water', 'src-wiki-port-la'),
          fact('Waterfront', '43 miles', 'src-wiki-port-la'),
          fact('Cargo terminals', '25', 'src-wiki-port-la'),
          fact('Container cranes', '82', 'src-wiki-port-la'),
        ],
      },
      facilities: {
        body: 'The World Cruise Center in San Pedro, beneath the Vincent Thomas Bridge, has three passenger ship berths.',
      },
      history: {
        facts: [fact('Founded', 'December 9, 1907', 'src-wiki-port-la')],
      },
    },
    imageIds: ['img-port-la'],
    officialWebsite: 'https://www.portoflosangeles.org/',
    featured: false,
    sourceIds: ['src-wiki-port-la', 'src-wd-port-la'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-monterey-bay-aquarium',
    slug: 'monterey-bay-aquarium',
    name: 'Monterey Bay Aquarium',
    placeTypeId: 'type-garden-aquarium',
    brandId: null,
    stateCode: 'CA',
    city: 'Monterey',
    address: null,
    lat: 36.618253,
    lng: -121.901481,
    coordinatesSourceId: 'src-wd-monterey-aquarium',
    summary:
      'A nonprofit aquarium on Cannery Row, built in an old sardine cannery, that pioneered living kelp forest and jellyfish exhibits.',
    sections: {
      overview: {
        body: "The aquarium focuses on the marine habitats of Monterey Bay, right outside its windows. Its opening helped revive Cannery Row, and its research and conservation work, from sea otters to sustainable seafood, reaches far beyond the building.",
      },
      exhibits: {
        items: [
          'The first exhibit of a living kelp forest',
          'Jellyfish, whose care in captivity its biologists helped pioneer',
          'The first aquarium to successfully care for and display a great white shark',
        ],
      },
      wildlife: {
        body: "Conservation and research focus on sea otters, seabirds and tunas. Its Seafood Watch guide, published since 1999, has shaped the debate about sustainable seafood.",
      },
      history: {
        facts: [
          fact('Opened', 'October 20, 1984', 'src-wd-monterey-aquarium'),
          fact('Site', 'A former sardine cannery on Cannery Row', 'src-wiki-monterey-aquarium'),
        ],
      },
    },
    imageIds: ['img-monterey-aquarium'],
    officialWebsite: 'https://www.montereybayaquarium.org/',
    featured: false,
    sourceIds: ['src-wiki-monterey-aquarium', 'src-wd-monterey-aquarium'],
    verificationStatus: 'partial',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-cabazon-dinosaurs',
    slug: 'cabazon-dinosaurs',
    name: 'Cabazon Dinosaurs',
    placeTypeId: 'type-roadside-attraction',
    brandId: null,
    stateCode: 'CA',
    city: 'Cabazon',
    address: null,
    lat: 33.9201,
    lng: -116.773,
    coordinatesSourceId: 'src-wd-cabazon',
    summary:
      'Two giant concrete dinosaurs beside Interstate 10 west of Palm Springs, built by a sculptor to bring customers to his diner.',
    sections: {
      overview: {
        body: 'Sculptor and theme park artist Claude Bell built "Dinny" and "Mr. Rex" to make drivers on Interstate 10 stop at his Wheel Inn restaurant. The plan worked well enough that the dinosaurs outlived the restaurant and became famous in their own right, most of all through the 1985 film Pee-wee’s Big Adventure.',
      },
      architecture: {
        facts: [
          fact('Dinny', 'Brontosaurus, 150 ft (46 m) long', 'src-wiki-cabazon'),
          fact('Mr. Rex', 'Tyrannosaurus rex, 65 ft (20 m) tall', 'src-wiki-cabazon'),
          fact('Construction', 'Steel and concrete', 'src-wiki-cabazon'),
        ],
      },
      history: {
        items: [
          '1958: Claude Bell opens the Wheel Inn restaurant (it closed in 2013)',
          '1964: Bell begins building the dinosaurs',
          '1975: Dinny is completed',
          '1986: Mr. Rex is completed',
          'Mid-1990s: the Bell family sells the property',
          '2005: new owners add a creationist museum; that material has since been removed',
        ],
      },
      access: {
        body: 'Both dinosaurs are visible from Interstate 10, just west of Palm Springs.',
      },
    },
    imageIds: ['img-cabazon-rex'],
    officialWebsite: 'https://www.cabazondinosaurs.com/',
    featured: true,
    sourceIds: ['src-wiki-cabazon', 'src-wd-cabazon'],
    verificationStatus: 'partial',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-slab-city',
    slug: 'slab-city',
    name: 'Slab City',
    placeTypeId: 'type-off-grid-community',
    brandId: null,
    stateCode: 'CA',
    city: 'Imperial County',
    address: null,
    lat: 33.2575,
    lng: -115.4625,
    coordinatesSourceId: 'src-wd-slab-city',
    summary:
      'An unincorporated off-grid settlement in the California desert, named for the concrete slabs left behind by a World War II Marine Corps camp.',
    sections: {
      overview: {
        body: 'Slab City has no developer, no plan and no utilities. People, many of them winter "snowbirds", settle among the concrete foundations of a former military camp. It attracts those who want to live outside mainstream society, and is in many ways the opposite of a master-planned community.',
      },
      community: {
        facts: [
          fact('Status', 'Unincorporated, off-the-grid community', 'src-wiki-slab-city'),
          fact('Location', 'Salton Trough, Imperial County', 'src-wiki-slab-city'),
        ],
      },
      history: {
        items: [
          'October 15, 1942: Marine Corps Camp Dunlap is commissioned',
          'By 1949: military operations are greatly reduced; the base is later dismantled',
          'The concrete slabs left behind give the community its name',
        ],
      },
    },
    imageIds: ['img-slab-city'],
    officialWebsite: null,
    featured: false,
    sourceIds: ['src-wiki-slab-city', 'src-wd-slab-city'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-south-coast-plaza',
    slug: 'south-coast-plaza',
    name: 'South Coast Plaza',
    placeTypeId: 'type-regional-mall',
    brandId: null,
    stateCode: 'CA',
    city: 'Costa Mesa',
    address: '3333 Bristol Street, Costa Mesa, CA 92626',
    lat: 33.691111111111,
    lng: -117.88944444444,
    coordinatesSourceId: 'src-wd-south-coast-plaza',
    summary:
      "California's largest shopping mall, built on a family lima bean field in Orange County in 1967 and still owned by the same family.",
    sections: {
      overview: {
        body: 'South Coast Plaza was developed by the Segerstrom family on one of their lima bean fields as Orange County grew. Unlike most American malls it was never sold to a real estate investment trust, and it has become known for its concentration of fashion retail.',
      },
      facilities: {
        facts: [
          fact('Floor area', 'About 2.8 million sq ft', 'src-wiki-south-coast-plaza'),
          fact('Retailers', 'About 275', 'src-wiki-south-coast-plaza'),
          fact('Anchors', "Macy's, Nordstrom and Bloomingdale's", 'src-wiki-south-coast-plaza'),
          fact('Rank', 'Largest shopping mall in California', 'src-wiki-south-coast-plaza'),
        ],
      },
      history: {
        facts: [
          fact('Opened', 'March 15, 1967', 'src-wiki-south-coast-plaza'),
          fact('Architect', 'Victor Gruen Associates', 'src-wiki-south-coast-plaza'),
          fact('Owner', 'The Segerstrom family', 'src-wiki-south-coast-plaza'),
        ],
      },
    },
    imageIds: ['img-south-coast-plaza'],
    officialWebsite: 'https://www.southcoastplaza.com/',
    featured: false,
    sourceIds: ['src-wiki-south-coast-plaza', 'src-wd-south-coast-plaza'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
];
