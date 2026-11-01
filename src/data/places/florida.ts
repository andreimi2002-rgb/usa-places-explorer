import type { Place } from '../../types';
import { CHECKED, fact } from './helpers';

/** Verified place records for Florida. See docs/VERIFICATION.md for gaps. */
export const floridaPlaces: Place[] = [
  {
    id: 'place-universal-orlando-resort',
    slug: 'universal-orlando-resort',
    name: 'Universal Orlando Resort',
    placeTypeId: 'type-theme-park-resort',
    brandId: 'brand-universal',
    stateCode: 'FL',
    city: 'Orlando',
    address: null,
    lat: 28.4743207,
    lng: -81.470008,
    coordinatesSourceId: 'src-wd-universal-orlando',
    summary:
      "Universal's flagship resort: a cluster of theme parks, a water park, hotels and the CityWalk district that grew from a single studio park opened in 1990.",
    sections: {
      overview: {
        body: 'Universal Orlando began as one park, Universal Studios Florida, and was turned into a full resort to compete with Walt Disney World down the road. Each expansion added a park, hotels or entertainment, most recently Epic Universe in 2025.',
      },
      parks: {
        facts: [
          fact('Universal Studios Florida', 'Opened June 1990', 'src-wiki-universal-orlando'),
          fact('Universal Islands of Adventure', 'Opened 1999', 'src-wiki-universal-orlando'),
          fact("Universal Volcano Bay (water park)", 'Opened 2017', 'src-wiki-universal-orlando'),
          fact('Universal Epic Universe', 'Opened May 2025', 'src-wiki-universal-orlando'),
        ],
      },
      hotels: {
        body: 'Most of the resort hotels are managed by Loews Hotels & Resorts; the Hard Rock Hotel is run jointly with Hard Rock International.',
        facts: [fact('Resort hotels', '11', 'src-wiki-universal-orlando')],
      },
      attractions: {
        items: [
          'Universal CityWalk, a shopping, dining and nightlife district opened in 1999',
          'The Wizarding World of Harry Potter, with areas in two of the parks',
          "Halloween Horror Nights, the resort's annual autumn event",
        ],
      },
    },
    imageIds: ['img-universal-orlando-2023', 'img-universal-orlando-globe'],
    officialWebsite: 'https://www.universalorlando.com/',
    featured: true,
    sourceIds: ['src-wiki-universal-orlando', 'src-wd-universal-orlando'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-kennedy-space-center-visitor-complex',
    slug: 'kennedy-space-center-visitor-complex',
    name: 'Kennedy Space Center Visitor Complex',
    placeTypeId: 'type-space-center',
    brandId: null,
    stateCode: 'FL',
    city: 'Merritt Island',
    address: null,
    lat: 28.5233,
    lng: -80.6819,
    coordinatesSourceId: 'src-wd-ksc-visitor-complex',
    summary:
      "The public gateway to NASA's Kennedy Space Center, with the space shuttle Atlantis, historic rockets and bus tours of the spaceport.",
    sections: {
      overview: {
        body: "The visitor complex sits at the edge of NASA's launch site on Florida's Space Coast. It mixes museum displays and real flown hardware with simulators and films, and its bus tours take visitors out to the launch area and the separate Apollo/Saturn V Center.",
      },
      exhibits: {
        items: [
          'Space Shuttle Atlantis, displayed with the Shuttle Launch Experience simulator',
          'Historic spacecraft, rockets and memorabilia',
          'Two IMAX theaters',
          'The Apollo/Saturn V Center, reached by bus tour',
        ],
      },
      attractions: {
        body: 'Admission includes bus transportation to Launch Complex 39 and the surrounding Kennedy Space Center property. The complex also offers astronaut training simulators and daily talks by a veteran NASA astronaut.',
      },
      history: {
        facts: [
          fact('Opened', 'August 1, 1967', 'src-wiki-ksc-visitor-complex'),
          fact('Visitors in first year', '500,000 (1967)', 'src-wiki-ksc-visitor-complex', '1967-12-31'),
          fact('Operator', 'Delaware North, since 1995', 'src-wiki-ksc-visitor-complex'),
        ],
      },
    },
    imageIds: ['img-ksc-visitor-complex'],
    officialWebsite: 'https://www.kennedyspacecenter.com/',
    featured: true,
    sourceIds: ['src-wiki-ksc-visitor-complex', 'src-wd-ksc-visitor-complex'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-the-villages',
    slug: 'the-villages',
    name: 'The Villages',
    placeTypeId: 'type-master-planned-community',
    brandId: null,
    stateCode: 'FL',
    city: 'The Villages',
    address: null,
    lat: 28.937777777778,
    lng: -81.971111111111,
    coordinatesSourceId: 'src-wd-the-villages',
    summary:
      'A vast age-restricted retirement community in central Florida, built around themed town squares and famous for getting around by golf cart.',
    sections: {
      overview: {
        body: "The Villages is a master-planned community for people 55 and over, spread across three Florida counties. It began as a mobile home park in the early 1970s and was steadily expanded by the same family-led developer into a major retirement destination.",
      },
      community: {
        facts: [
          fact('Population (census-designated place)', '79,077', 'src-wiki-the-villages', '2020-04-01'),
          fact('Counties', 'Sumter, Marion and Lake', 'src-wiki-the-villages'),
          fact('Age rule', 'At least 80% of homes must have a resident aged 55 or older', 'src-wiki-the-villages'),
        ],
      },
      facilities: {
        body: 'Shopping and nightlife are concentrated in town centers designed as small-town squares, where weekly events such as live music take place. Golf cart paths and overpasses connect neighborhoods to them.',
        items: ['Spanish Springs', 'Lake Sumter Landing', 'Brownwood Paddock Square', 'Eastport', 'Sawgrass Grove'],
      },
      history: {
        items: [
          '1960s: Michigan businessman Harold Schwartz sells land in the area by mail order',
          'Early 1970s: Schwartz and a partner develop Orange Blossom Gardens, a mobile home park',
          "1983: Schwartz buys out his partner and brings in his son, H. Gary Morse, who leads the community's expansion",
        ],
      },
    },
    imageIds: ['img-villages-lake-sumter', 'img-villages-spanish-springs'],
    officialWebsite: 'https://www.thevillages.com/',
    featured: false,
    sourceIds: ['src-wiki-the-villages', 'src-wd-the-villages'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-daytona-international-speedway',
    slug: 'daytona-international-speedway',
    name: 'Daytona International Speedway',
    placeTypeId: 'type-sports-venue',
    brandId: null,
    stateCode: 'FL',
    city: 'Daytona Beach',
    address: '1801 West International Speedway Blvd, Daytona Beach, FL 32114',
    lat: 29.185555555556,
    lng: -81.069444444444,
    coordinatesSourceId: 'src-wd-daytona-speedway',
    summary: "The 'World Center of Racing': home of the Daytona 500, NASCAR's most prestigious race, since 1959.",
    sections: {
      overview: {
        body: 'NASCAR founder Bill France Sr. built the speedway in 1959 to replace racing on the old Daytona Beach road course. Its steeply banked design allowed higher speeds and gave fans a better view, and it remains the centerpiece of American stock car racing.',
      },
      events: {
        items: [
          'The Daytona 500, which opens the NASCAR season',
          'The 24 Hours of Daytona endurance sports car race',
          'Motorcycle, karting and other racing series',
        ],
      },
      architecture: {
        facts: [
          fact('Main oval', '2.5-mile (4.0 km) tri-oval', 'src-wiki-daytona-speedway'),
          fact('Road course', '3.56-mile (5.7 km) sports car course', 'src-wiki-daytona-speedway'),
          fact('Infield lake', 'Lake Lloyd, 29 acres', 'src-wiki-daytona-speedway'),
          fact('"Daytona Rising" rebuild', 'Completed January 2016, about $400 million', 'src-wiki-daytona-speedway'),
        ],
      },
      history: {
        facts: [
          fact('Opened', 'February 22, 1959', 'src-wiki-daytona-speedway'),
          fact('Operator', 'NASCAR, under a lease with the City of Daytona Beach that runs to 2054', 'src-wiki-daytona-speedway'),
        ],
      },
    },
    imageIds: ['img-daytona-speedway'],
    officialWebsite: 'https://www.daytonainternationalspeedway.com/',
    featured: false,
    sourceIds: ['src-wiki-daytona-speedway', 'src-wd-daytona-speedway'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-everglades-national-park',
    slug: 'everglades-national-park',
    name: 'Everglades National Park',
    placeTypeId: 'type-national-park',
    brandId: null,
    stateCode: 'FL',
    city: 'Miami-Dade and Monroe counties',
    address: null,
    lat: 25.3125,
    lng: -80.6875,
    coordinatesSourceId: 'src-wd-everglades',
    summary:
      "A subtropical 'river of grass' protecting the southern part of the original Everglades, and the first U.S. national park created to protect an ecosystem.",
    sections: {
      overview: {
        body: 'Most national parks protect dramatic scenery. Everglades National Park was created instead to protect a fragile wetland: a slow-moving river of fresh water flowing southwest from Lake Okeechobee toward Florida Bay through sawgrass marsh, cypress and mangrove forest.',
      },
      landscape: {
        facts: [
          fact('Area', 'More than 1.5 million acres', 'src-wiki-everglades'),
          fact('Share of the original Everglades protected', 'The southern 20%', 'src-wiki-everglades'),
          fact('Wilderness', 'Over 86% of the park', 'src-wiki-everglades'),
        ],
        body: 'The park holds the largest mangrove ecosystem in the Western Hemisphere, and most of South Florida\'s fresh water is recharged here.',
      },
      wildlife: {
        body: 'It is the most significant breeding ground for tropical wading birds in North America. Threatened and protected species include the Florida panther, the American crocodile and the West Indian manatee.',
        facts: [fact('Bird species', 'About 350', 'src-wiki-everglades')],
      },
      history: {
        facts: [
          fact('Established as a national park', 'December 6, 1947', 'src-wd-everglades'),
          fact('UNESCO World Heritage Site', '1979', 'src-wiki-everglades'),
        ],
      },
    },
    imageIds: ['img-everglades-sunset'],
    officialWebsite: 'https://www.nps.gov/ever/',
    featured: true,
    sourceIds: ['src-wiki-everglades', 'src-wd-everglades'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-bucees-daytona-beach',
    slug: 'bucees-daytona-beach',
    name: "Buc-ee's Daytona Beach",
    placeTypeId: 'type-travel-center',
    brandId: 'brand-bucees',
    stateCode: 'FL',
    city: 'Daytona Beach',
    address: '2330 Gateway North Drive, Daytona Beach, FL 32117',
    lat: 29.223997,
    lng: -81.101024,
    coordinatesSourceId: 'src-osm-bucees-daytona',
    summary: "One of Buc-ee's first stores in Florida, opened in 2021 near Interstate 95 in Daytona Beach.",
    sections: {
      overview: {
        body: "Buc-ee's reached Florida in 2021, opening in St. Augustine in February and in Daytona Beach a month later. The Daytona store follows the chain's formula of a large fuel plaza beside a big store selling barbecue, snacks and branded goods.",
      },
      facilities: {
        facts: [fact('Store number', '#47', 'src-bucees-locations')],
        items: ['Car wash on site'],
      },
      fuel: {
        facts: [
          fact('Ethanol-free gasoline', '87 and 90 octane', 'src-bucees-locations'),
          fact('Diesel exhaust fluid (DEF)', 'Available', 'src-bucees-locations'),
        ],
      },
      history: {
        facts: [fact('Opened', 'March 22, 2021', 'src-wiki-bucees')],
      },
    },
    imageIds: ['img-bucees-daytona'],
    officialWebsite: 'https://buc-ees.com/locations/',
    featured: false,
    sourceIds: ['src-bucees-locations', 'src-wiki-bucees', 'src-osm-bucees-daytona'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
];
