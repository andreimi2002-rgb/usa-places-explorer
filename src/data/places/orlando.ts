import type { ISODate, Place } from '../../types';
import { fact as baseFact } from './helpers';

/** Date the Phase 4.5 (Orlando) sources were read. */
const CHECKED_ORLANDO: ISODate = '2026-11-02';
const fact = (label: string, value: string, sourceId: string, asOf: ISODate = CHECKED_ORLANDO) =>
  baseFact(label, value, sourceId, asOf);

const meta = {
  featured: false,
  verificationStatus: 'verified',
  lastVerified: CHECKED_ORLANDO,
  createdAt: CHECKED_ORLANDO,
} as const;

/**
 * In-depth profiles for Greater Orlando (Phase 4.5). Text written for this
 * atlas from the cited sources. See docs/VERIFICATION.md for gaps.
 */
export const orlandoPlaces: Place[] = [
  {
    ...meta,
    featured: true,
    id: 'place-walt-disney-world',
    slug: 'walt-disney-world-resort',
    name: 'Walt Disney World Resort',
    placeTypeId: 'type-theme-park-resort',
    brandId: 'brand-disney-parks',
    stateCode: 'FL',
    city: 'Bay Lake',
    address: null,
    lat: 28.3722,
    lng: -81.5494,
    coordinatesSourceId: 'src-wd-wdw',
    summary:
      "Disney's largest resort: four theme parks, two water parks and dozens of hotels on a huge site southwest of Orlando, open since 1971.",
    sections: {
      overview: {
        body: 'Walt Disney planned "The Florida Project" in the 1960s as a self-contained resort with room to grow, after outside businesses had crowded in around Disneyland in California. He died in 1966, before construction began; his brother Roy saw the project through and named it Walt Disney World in his memory. The resort lies outside Orlando city limits, mostly in southwestern Orange County, and includes the small cities of Bay Lake and Lake Buena Vista.',
      },
      parks: {
        facts: [
          fact('Magic Kingdom', 'Opened October 1, 1971', 'src-wiki-wdw'),
          fact('EPCOT', 'Opened October 1, 1982', 'src-wiki-wdw'),
          fact("Disney's Hollywood Studios", 'Opened May 1, 1989', 'src-wiki-wdw'),
          fact("Disney's Animal Kingdom", 'Opened April 22, 1998', 'src-wiki-wdw'),
          fact("Disney's Typhoon Lagoon (water park)", 'Opened June 1, 1989', 'src-wiki-wdw'),
          fact("Disney's Blizzard Beach (water park)", 'Opened April 1, 1995', 'src-wiki-wdw'),
        ],
      },
      hotels: {
        body: 'Besides the Disney-owned hotels, several hotels on and around the property are run by other companies.',
        facts: [fact('Disney-owned resort hotels', '31, plus one camping resort', 'src-wiki-wdw')],
      },
      attractions: {
        items: [
          'Disney Springs, the shopping, dining and entertainment district, open since 1975',
          "Disney's BoardWalk, a waterfront entertainment area opened in 1996",
          'Four golf courses and a competitive sports complex',
        ],
      },
      history: {
        facts: [
          fact('Construction began', '1967', 'src-wiki-wdw'),
          fact('Opened', 'October 1, 1971', 'src-wiki-wdw'),
          fact('Area', 'About 27,000 acres', 'src-wiki-wdw'),
          fact('Annual attendance', 'More than 49 million (2024)', 'src-wiki-wdw', '2024-12-31'),
        ],
      },
      access: {
        body: "Disney Transport runs free buses, monorails, boats and the Disney Skyliner gondola (opened 2019) across the property. The monorail links Magic Kingdom and EPCOT with several resort hotels through the Transportation and Ticket Center. By car, the resort is reached from several exits on Interstate 4, and from exits on SR 417 and SR 429.",
      },
    },
    imageIds: ['img-wdw-epcot-monorail', 'img-wdw-castle'],
    officialWebsite: 'https://disneyworld.disney.go.com/',
    sourceIds: ['src-wiki-wdw', 'src-wd-wdw'],
  },
  {
    ...meta,
    id: 'place-seaworld-orlando',
    slug: 'seaworld-orlando',
    name: 'SeaWorld Orlando',
    placeTypeId: 'type-theme-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: '7007 SeaWorld Drive, Orlando, FL',
    lat: 28.4108,
    lng: -81.4625,
    coordinatesSourceId: 'src-wd-seaworld-orlando',
    summary:
      "A marine-life theme park opened in 1973 that pairs animal habitats and shows with some of Orlando's biggest roller coasters.",
    sections: {
      overview: {
        body: 'SeaWorld Orlando opened in December 1973 as the third park in the SeaWorld chain, two years after Magic Kingdom. It began as a park of animal shows with few rides; after Anheuser-Busch bought it in 1989 it added major roller coasters. Today it is owned and run by United Parks & Resorts, which also operates Discovery Cove and the Aquatica water park next door.',
      },
      attractions: {
        items: [
          'Mako, a hypercoaster opened in 2016',
          'Kraken, a floorless roller coaster opened in 2000',
          'Journey to Atlantis, opened in 1998 as the first water coaster in the U.S.',
          'Manta, a flying coaster opened in 2009',
          'Ice Breaker (2022), Pipeline: The Surf Coaster (2023) and Penguin Trek (2024)',
          'Sesame Street, a children\'s area themed to the TV series since 2019',
        ],
      },
      wildlife: {
        body: 'Orca presentations take place at Shamu Stadium. The indoor Wild Arctic exhibit holds beluga whales, Pacific walruses and harbor seals, and the shallow-water area has dolphins, sea turtles, manatees and rays.',
      },
      history: {
        body: 'In 2010 the orca Tilikum killed trainer Dawn Brancheau during a show; federal safety regulators fined the park and required barriers between trainers and whales. The 2013 documentary Blackfish raised wider concerns about keeping orcas in captivity, and the SeaWorld chain lost visitors and revenue in the following years.',
        facts: [
          fact('Opened', 'December 15, 1973', 'src-wiki-seaworld-orlando'),
          fact('Owner and operator', 'United Parks & Resorts', 'src-wiki-seaworld-orlando'),
          fact('Area', '200 acres', 'src-wiki-seaworld-orlando'),
          fact('Visitors', '4.45 million, estimated (2022)', 'src-wiki-seaworld-orlando', '2022-12-31'),
        ],
      },
    },
    imageIds: ['img-seaworld-mako', 'img-seaworld-lighthouse'],
    officialWebsite: 'https://seaworld.com/orlando/',
    sourceIds: ['src-wiki-seaworld-orlando', 'src-wd-seaworld-orlando'],
  },
  {
    ...meta,
    id: 'place-icon-park',
    slug: 'icon-park',
    name: 'ICON Park',
    placeTypeId: 'type-amusement-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: null,
    lat: 28.4432,
    lng: -81.4693,
    coordinatesSourceId: 'src-wd-icon-park',
    summary:
      'A free-entry entertainment complex on International Drive, built around a 400-foot observation wheel, with separately ticketed attractions.',
    sections: {
      overview: {
        body: 'ICON Park is not a single amusement park. Its attractions, shops and restaurants are run by different companies that lease space on the site, so entering the complex is free and each attraction sells its own tickets, alone or in bundles. It opened in 2015 as I-Drive 360 and took its current name in 2018.',
      },
      attractions: {
        items: [
          'The Orlando Eye, a 400-foot (120 m) observation wheel',
          'Madame Tussauds wax museum and Sea Life Aquarium Orlando',
          'Orlando Slingshot, a 300-foot ride that catapults two riders into the air',
          'Museum of Illusions, a 7D motion theater, a carousel and a small train',
        ],
      },
      history: {
        facts: [
          fact('Opened', 'May 4, 2015', 'src-wiki-icon-park'),
          fact('Original name', 'I-Drive 360 (until 2018)', 'src-wiki-icon-park'),
          fact('Size', '20 acres', 'src-wiki-icon-park'),
        ],
      },
    },
    imageIds: ['img-icon-park-wheel', 'img-icon-park-night'],
    officialWebsite: 'https://www.iconparkorlando.com/',
    sourceIds: ['src-wiki-icon-park', 'src-wd-icon-park'],
    verificationStatus: 'partial',
  },
  {
    ...meta,
    id: 'place-lake-eola-park',
    slug: 'lake-eola-park',
    name: 'Lake Eola Park',
    placeTypeId: 'type-city-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: '195 North Rosalind Avenue, Orlando, FL',
    lat: 28.54389,
    lng: -81.36972,
    coordinatesSourceId: 'src-wd-lake-eola',
    summary:
      "Downtown Orlando's central park: a lake ringed by a walking path, with a fountain that is an official symbol of the city.",
    sections: {
      overview: {
        body: 'The park wraps around Lake Eola in the heart of downtown Orlando. The Walt Disney Amphitheater on its west side hosts concerts and community events, and the east side has a Chinese pagoda and a playground.',
      },
      landscape: {
        body: 'Lake Eola is a sinkhole. Its deepest point lies a short distance from the Linton E. Allen Memorial Fountain, which changes color at night.',
        facts: [
          fact('Lake area', '23 acres', 'src-wiki-lake-eola'),
          fact('Path around the lake', '0.9 mile (1.4 km)', 'src-wiki-lake-eola'),
          fact('Deepest point', 'About 80 feet (24 m)', 'src-wiki-lake-eola'),
        ],
      },
      events: {
        items: [
          'Orlando Farmers Market, every Sunday',
          'Fireworks Over the Fountain on the Fourth of July',
          'Come Out With Pride festival in October',
          'Fiesta in the Park arts and crafts show in November',
        ],
      },
      history: {
        body: 'Jacob Summerlin offered land around the lake to the city in 1883 on condition that it be made into a park. A fountain was installed in 1912 and replaced in 1957; the current one was renamed for Linton E. Allen in 1966. After lightning damaged it in 2009, the city rebuilt it and rededicated it on July 4, 2011.',
        facts: [
          fact('Declared a park', '1892', 'src-wiki-lake-eola'),
          fact('Current fountain', 'Installed 1957, rebuilt 2011', 'src-wiki-lake-eola'),
        ],
      },
    },
    imageIds: ['img-lake-eola'],
    officialWebsite: null,
    sourceIds: ['src-wiki-lake-eola', 'src-wd-lake-eola'],
  },
  {
    ...meta,
    id: 'place-orlando-international-airport',
    slug: 'orlando-international-airport',
    name: 'Orlando International Airport',
    placeTypeId: 'type-airport',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: null,
    lat: 28.42944,
    lng: -81.30889,
    coordinatesSourceId: 'src-wd-mco',
    summary:
      "Orlando's main airport and Florida's busiest, and one of the largest commercial airports in the U.S. by land area.",
    sections: {
      overview: {
        body: 'The airport sits about 6 miles southeast of downtown Orlando. Its code, MCO, comes from its earlier life as McCoy Air Force Base, which closed in 1975. Southwest carries the most passengers, and the airport is a base for Breeze Airways, Frontier and Southwest and a focus city for JetBlue.',
      },
      operations: {
        facts: [
          fact('Passengers', '57,675,573 (2025)', 'src-wiki-mco', '2025-12-31'),
          fact('Rank', 'Busiest in Florida, 7th in the U.S. (2025)', 'src-wiki-mco', '2025-12-31'),
          fact('Daily flights', 'More than 1,000, on 40+ airlines', 'src-wiki-mco'),
          fact('Land area', '11,605 acres', 'src-wiki-mco'),
        ],
      },
      facilities: {
        items: [
          'Terminals A and B share one building, with four airside concourses reached by people movers',
          'Terminal C, the South Terminal, serves JetBlue and many international airlines',
          'The Intermodal Terminal, where Brightline trains to South Florida have run since September 2023',
          'A Hyatt Regency hotel inside the main terminal',
        ],
      },
      history: {
        facts: [
          fact('Airfield built', '1940', 'src-wiki-mco'),
          fact('Opened', 'October 1961', 'src-wiki-mco'),
          fact('McCoy Air Force Base closed', '1975', 'src-wiki-mco'),
        ],
      },
    },
    imageIds: ['img-mco-terminal'],
    officialWebsite: 'https://flymco.com/',
    sourceIds: ['src-wiki-mco', 'src-wd-mco'],
  },
  {
    ...meta,
    id: 'place-kia-center',
    slug: 'kia-center',
    name: 'Kia Center',
    placeTypeId: 'type-sports-venue',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: '400 West Church Street, Orlando, FL',
    lat: 28.53917,
    lng: -81.38361,
    coordinatesSourceId: 'src-wd-kia-center',
    summary:
      "Downtown Orlando's arena and home of the NBA's Orlando Magic, opened in 2010 and called the Amway Center until 2023.",
    sections: {
      overview: {
        body: 'The arena is home to the Orlando Magic of the NBA and the Orlando Solar Bears of the ECHL. The City of Orlando owns it, and it hosts concerts, graduations and wrestling as well as sports.',
      },
      events: {
        items: [
          'The 2012 NBA All-Star Game',
          'NCAA men\'s basketball tournament games in 2014, 2017 and 2023',
          "WWE's 2016 Royal Rumble, and WWE's closed-door ThunderDome shows in 2020",
        ],
      },
      architecture: {
        body: 'Populous designed the building. A glass lobby opens onto Church Street, and a corner tower lit with color-changing LEDs holds the team store, a brewery and a rooftop bar. The arena also displays an art collection of more than 340 works.',
      },
      history: {
        facts: [
          fact('Opened', 'October 1, 2010', 'src-wiki-kia-center'),
          fact('Cost', 'About $480 million, including land and infrastructure', 'src-wiki-kia-center'),
          fact('Renamed Kia Center', 'December 20, 2023', 'src-wiki-kia-center'),
          fact('Capacity', '18,846 for basketball', 'src-wiki-kia-center'),
        ],
      },
    },
    imageIds: ['img-kia-center'],
    officialWebsite: 'https://www.kiacenter.com/',
    sourceIds: ['src-wiki-kia-center', 'src-wd-kia-center'],
  },
  {
    ...meta,
    id: 'place-orlando-museum-of-art',
    slug: 'orlando-museum-of-art',
    name: 'Orlando Museum of Art',
    placeTypeId: 'type-art-museum',
    brandId: null,
    stateCode: 'FL',
    city: 'Orlando',
    address: '2416 North Mills Avenue, Orlando, FL',
    lat: 28.5727,
    lng: -81.3644,
    coordinatesSourceId: 'src-wd-oma',
    summary:
      "Orlando's art museum, started by local artists in 1924, with American, contemporary, ancient American and African art.",
    sections: {
      overview: {
        body: 'The museum grew out of a group of artists who met in the early 1920s to show and critique each other\'s work. It mixes changing exhibitions, including traveling shows, with displays from its own collection, and is accredited by the American Alliance of Museums.',
      },
      exhibits: {
        items: [
          'More than 2,400 objects in the permanent collection',
          'American art from the 18th century to 1945, and contemporary art',
          'Art of the Ancient Americas and African art',
          'The Florida Prize in Contemporary Art, an annual show of Florida artists since 2014',
        ],
      },
      history: {
        body: 'In 2022 the FBI removed an entire exhibition of paintings attributed to Jean-Michel Basquiat after their authenticity was questioned.',
        facts: [
          fact('Founded', '1924, as the Orlando Art Association', 'src-wiki-oma'),
          fact('Renamed', 'Loch Haven Art Center (1960), Orlando Museum of Art (1986)', 'src-wiki-oma'),
        ],
      },
      architecture: {
        body: 'Its first purpose-built home, designed by James Gamble Rogers III, was finished in 1960 and later enlarged. A $13.5 million project completed in 1997 brought the building to about 80,000 square feet.',
      },
      access: {
        body: 'Parking on site is free.',
      },
    },
    imageIds: ['img-oma'],
    officialWebsite: 'https://omart.org/',
    sourceIds: ['src-wiki-oma', 'src-wd-oma'],
  },
  {
    ...meta,
    id: 'place-gatorland',
    slug: 'gatorland',
    name: 'Gatorland',
    placeTypeId: 'type-theme-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Southchase',
    address: null,
    lat: 28.3556,
    lng: -81.4042,
    coordinatesSourceId: 'src-wd-gatorland',
    summary:
      "A family-owned alligator park on the Orange Blossom Trail, open since 1949 and billed as the 'Alligator Capital of the World'.",
    sections: {
      overview: {
        body: 'Owen Godwin founded Gatorland in 1949 on former cattle land, and his family still owns it. Its postal address says Orlando, but the 110-acre park sits in Southchase, south of the city. It takes in nuisance alligators from trappers that would otherwise be killed.',
      },
      attractions: {
        items: [
          'Alligator feeding and alligator wrestling shows',
          'A zip line over alligator pools, added in 2011',
          'An off-road swamp vehicle tour',
          'Gatorland Express, a narrow-gauge train ride running since 1961',
        ],
      },
      wildlife: {
        body: 'The park holds thousands of alligators, including rare white (leucistic) ones, plus crocodiles, an aviary and a petting zoo. A breeding marsh has a boardwalk and an observation tower; it appeared in the 1984 film Indiana Jones and the Temple of Doom.',
      },
      history: {
        body: 'A fire in November 2006 destroyed the gift shop. The rebuilt entrance building, opened in 2008, kept the park\'s historic concrete alligator mouth.',
        facts: [
          fact('Founded', '1949', 'src-wiki-gatorland'),
          fact('Area', '110 acres', 'src-wiki-gatorland'),
        ],
      },
      access: {
        body: 'Gatorland is on South Orange Blossom Trail, south of Orlando.',
      },
    },
    imageIds: ['img-gatorland-entrance'],
    officialWebsite: 'https://www.gatorland.com/',
    sourceIds: ['src-wiki-gatorland', 'src-wd-gatorland'],
  },
  {
    ...meta,
    id: 'place-ucf',
    slug: 'university-of-central-florida',
    name: 'University of Central Florida',
    placeTypeId: 'type-university',
    brandId: null,
    stateCode: 'FL',
    city: 'Orange County',
    address: null,
    lat: 28.6016,
    lng: -81.2005,
    coordinatesSourceId: 'src-wd-ucf',
    summary:
      'One of the largest universities in the U.S., founded in 1963 to train engineers for the Space Coast, with its main campus east of Orlando.',
    sections: {
      overview: {
        body: 'UCF is a public research university in the State University System of Florida. It opened in 1968 as Florida Technological University, partly to train scientists and engineers for the space program around Kennedy Space Center, and took its current name in 1978 as its courses widened. It is classified R1, the top tier for research activity.',
      },
      facilities: {
        items: [
          'Main campus about 13 miles east of downtown Orlando, in unincorporated Orange County',
          'A downtown Orlando campus and a Health Sciences Campus at Lake Nona',
          'The Rosen College of Hospitality Management',
          'More than 230 degree programs across 13 colleges',
        ],
      },
      history: {
        facts: [
          fact('Founded', '1963', 'src-wiki-ucf'),
          fact('Opened', '1968, as Florida Technological University', 'src-wiki-ucf'),
          fact('Students', '70,674 (fall 2025)', 'src-wiki-ucf', '2025-12-31'),
          fact('Degrees awarded', 'More than 450,000 since opening', 'src-wiki-ucf'),
        ],
      },
    },
    imageIds: ['img-ucf-reflection-pond'],
    officialWebsite: 'https://www.ucf.edu/',
    sourceIds: ['src-wiki-ucf', 'src-wd-ucf'],
  },
  {
    ...meta,
    id: 'place-old-town-kissimmee',
    slug: 'old-town-kissimmee',
    name: 'Old Town',
    placeTypeId: 'type-amusement-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Kissimmee',
    address: null,
    lat: 28.3316,
    lng: -81.5158,
    coordinatesSourceId: 'src-wd-old-town',
    summary:
      'An open-air entertainment district in Kissimmee styled as a classic Florida town, with shops, rides and a weekly classic car show.',
    sections: {
      overview: {
        body: 'Old Town recreates a classic Florida town, with period-style storefronts lining a walkable street of about seventy shops, restaurants, bars, attractions and rides. It is owned by The Travel Corporation.',
      },
      attractions: {
        items: [
          'An 86-foot Ferris wheel from Italy with 18 gondolas',
          'Hurricane, a five-story family roller coaster',
          'Mortem Manor, a haunted house with live actors',
          'A carousel and an arcade with more than 50 games',
        ],
      },
      events: {
        body: 'The Saturday Classic Car Show & Cruise is billed as the longest-running weekly car show and cruise in America.',
      },
      history: {
        facts: [
          fact('Opened', 'December 1986', 'src-wiki-old-town'),
          fact('Reopened', 'April 2019, after two years of renovations', 'src-wiki-old-town'),
        ],
      },
    },
    imageIds: ['img-old-town-entrance', 'img-old-town-night'],
    officialWebsite: 'https://www.myoldtownusa.com/',
    sourceIds: ['src-wiki-old-town', 'src-wd-old-town'],
    verificationStatus: 'partial',
  },
];
