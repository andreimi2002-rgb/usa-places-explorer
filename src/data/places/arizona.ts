import type { Place } from '../../types';
import { CHECKED, fact } from './helpers';

/** Verified place records for Arizona. See docs/VERIFICATION.md for gaps. */
export const arizonaPlaces: Place[] = [
  {
    id: 'place-grand-canyon-national-park',
    slug: 'grand-canyon-national-park',
    name: 'Grand Canyon National Park',
    placeTypeId: 'type-national-park',
    brandId: null,
    stateCode: 'AZ',
    city: 'Coconino and Mohave counties',
    address: null,
    lat: 36.0553,
    lng: -112.122,
    coordinatesSourceId: 'src-wd-grand-canyon',
    summary:
      "The national park protecting the Grand Canyon, the great gorge of the Colorado River in northwestern Arizona.",
    sections: {
      overview: {
        body: 'The park centers on the Grand Canyon, a gorge of the Colorado River that is often counted among the Wonders of the World. It was the 15th site to be named a national park in the United States.',
      },
      landscape: {
        facts: [
          fact('Area', '1,217,262 acres', 'src-wiki-grand-canyon'),
          fact('Recreational visitors', 'More than 4.9 million (2024)', 'src-wiki-grand-canyon', '2024-12-31'),
        ],
        body: 'The primary public areas are the South and North Rims and the canyon between them.',
      },
      history: {
        items: [
          '1906: President Theodore Roosevelt creates the Grand Canyon Game Preserve',
          '1908: Grand Canyon National Monument is proclaimed',
          'February 26, 1919: Grand Canyon becomes a national park',
          '1979: designated a UNESCO World Heritage Site',
          'July 2025: the Dragon Bravo Fire destroys structures on the North Rim, including the Grand Canyon Lodge',
        ],
      },
    },
    imageIds: ['img-grand-canyon-mather-inversion'],
    officialWebsite: 'https://www.nps.gov/grca/',
    featured: true,
    sourceIds: ['src-wiki-grand-canyon', 'src-wd-grand-canyon'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-bucees-goodyear',
    slug: 'bucees-goodyear',
    name: "Buc-ee's Goodyear",
    placeTypeId: 'type-travel-center',
    brandId: 'brand-bucees',
    stateCode: 'AZ',
    city: 'Goodyear',
    address: '1001 N. Bullard Avenue, Goodyear, AZ 85338',
    lat: 33.457223,
    lng: -112.373549,
    coordinatesSourceId: 'src-osm-bucees-goodyear',
    summary: "Arizona's first Buc-ee's, opened near Interstate 10 in Goodyear in June 2026.",
    sections: {
      overview: {
        body: "Buc-ee's arrived in Arizona on June 22, 2026, opening a 74,000-square-foot store near Interstate 10 and Bullard Avenue in Goodyear.",
      },
      facilities: {
        facts: [
          fact('Store size', '74,000 sq ft', 'src-fox10-bucees-goodyear', '2026-06-22'),
          fact('Store number', '#72', 'src-bucees-locations'),
        ],
      },
      fuel: {
        facts: [
          fact('Gas pumps', 'Over 100', 'src-fox10-bucees-goodyear', '2026-06-22'),
          fact('Diesel exhaust fluid (DEF)', 'Available', 'src-bucees-locations'),
        ],
      },
      history: {
        facts: [fact('Opened', "June 22, 2026, Buc-ee's first store in Arizona", 'src-fox10-bucees-goodyear', '2026-06-22')],
      },
    },
    imageIds: ['img-bucees-goodyear'],
    officialWebsite: 'https://buc-ees.com/locations/',
    featured: true,
    sourceIds: ['src-fox10-bucees-goodyear', 'src-bucees-locations', 'src-osm-bucees-goodyear'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-wigwam-motel-holbrook',
    slug: 'wigwam-motel-holbrook',
    name: 'Wigwam Motel, Holbrook',
    placeTypeId: 'type-route-66-landmark',
    brandId: null,
    stateCode: 'AZ',
    city: 'Holbrook',
    address: '811 W. Hopi Dr., Holbrook, AZ 86025',
    lat: 34.902236,
    lng: -110.168267,
    coordinatesSourceId: 'src-wiki-wigwam-motel',
    summary:
      'A 1950 Route 66 motel where guests sleep in concrete tipis, closed when the Interstate bypassed town and reopened by the founder’s family.',
    sections: {
      overview: {
        body: 'Holbrook\'s Wigwam Motel is one of three surviving "Wigwam Villages", a small chain of motels built in the 1930s and 1940s whose rooms are shaped like tipis (despite the name, not wigwams). Two of the survivors stand on old Route 66: this one and another in San Bernardino, California.',
      },
      history: {
        items: [
          '1938: Arizona motel owner Chester E. Lewis sees the wigwam design in Cave City, Kentucky',
          '1950: Lewis builds the Holbrook Wigwam Village',
          '1974: the motel closes after Interstate 40 bypasses downtown Holbrook',
          'Two years after Lewis’s death in 1986, his children renovate and reopen it',
          'May 2, 2002: listed on the National Register of Historic Places as Wigwam Village #6',
        ],
      },
      architecture: {
        body: 'Each room is a freestanding tipi-shaped structure. Near the registration desk, a small room displays Chester Lewis’s memorabilia, including a collection of petrified wood.',
      },
    },
    imageIds: ['img-wigwam-holbrook'],
    officialWebsite: null,
    featured: true,
    sourceIds: ['src-wiki-wigwam-motel'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-taliesin-west',
    slug: 'taliesin-west',
    name: 'Taliesin West',
    placeTypeId: 'type-historic-landmark',
    brandId: null,
    stateCode: 'AZ',
    city: 'Scottsdale',
    address: null,
    lat: 33.60638888888889,
    lng: -111.84527777777778,
    coordinatesSourceId: 'src-wd-taliesin-west',
    summary:
      "Frank Lloyd Wright's desert winter home and studio from 1937 until his death in 1959, now a National Historic Landmark and World Heritage Site.",
    sections: {
      overview: {
        body: 'Wright and his apprentices began spending winters in Arizona in the 1930s and built Taliesin West in the foothills of the McDowell Mountains. It was home, studio and school at once, and it remains the headquarters of the Frank Lloyd Wright Foundation, which runs tours and events.',
      },
      architecture: {
        body: 'The buildings are laid out on a 45-degree grid and linked by courtyards and walkways. Walls are "desert masonry", local rocks set in concrete, originally topped by roofs of wood and canvas. Triangles, hexagons and natural motifs repeat throughout.',
      },
      history: {
        facts: [
          fact('Site purchased', '1937', 'src-wiki-taliesin-west'),
          fact('First structures built', '1938–1941, by Wright’s apprentices', 'src-wiki-taliesin-west'),
          fact('Designations', 'National Historic Landmark; UNESCO World Heritage Site', 'src-wiki-taliesin-west'),
        ],
      },
      attractions: {
        body: 'The Frank Lloyd Wright Foundation hosts tours and events at the site.',
      },
    },
    imageIds: ['img-taliesin-west'],
    officialWebsite: null,
    featured: false,
    sourceIds: ['src-wiki-taliesin-west', 'src-wd-taliesin-west'],
    verificationStatus: 'partial',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-desert-botanical-garden',
    slug: 'desert-botanical-garden',
    name: 'Desert Botanical Garden',
    placeTypeId: 'type-garden-aquarium',
    brandId: null,
    stateCode: 'AZ',
    city: 'Phoenix',
    address: '1201 N. Galvin Parkway, Phoenix, AZ',
    lat: 33.46194444444444,
    lng: -111.94472222222223,
    coordinatesSourceId: 'src-wd-desert-botanical-garden',
    summary: 'A 140-acre garden in Phoenix’s Papago Park devoted to desert plants and known for its rich collections of cacti and agaves.',
    sections: {
      overview: {
        body: 'The garden focuses on plants adapted to deserts, from species native to the Phoenix area, about a third of the collection, to collections from Australia, Baja California and South America. Trails lead through recreated habitats such as mesquite bosque, semi-desert grassland and upland chaparral.',
      },
      exhibits: {
        facts: [
          fact('Plants', 'More than 50,000, in more than 4,000 taxa', 'src-wiki-desert-botanical-garden'),
          fact('Cacti', '13,973 plants in 1,320 taxa', 'src-wiki-desert-botanical-garden'),
          fact('Agaves', '4,026 plants in 248 taxa', 'src-wiki-desert-botanical-garden'),
        ],
      },
      history: {
        facts: [
          fact('Founded', '1937, by the Arizona Cactus and Native Flora Society', 'src-wiki-desert-botanical-garden'),
          fact('At this site since', '1939', 'src-wiki-desert-botanical-garden'),
          fact('Area', '140 acres', 'src-wiki-desert-botanical-garden'),
        ],
      },
    },
    imageIds: ['img-desert-botanical-garden'],
    officialWebsite: 'https://dbg.org/',
    featured: false,
    sourceIds: ['src-wiki-desert-botanical-garden', 'src-wd-desert-botanical-garden'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
  {
    id: 'place-phoenix-sky-harbor',
    slug: 'phoenix-sky-harbor-international-airport',
    name: 'Phoenix Sky Harbor International Airport',
    placeTypeId: 'type-airport',
    brandId: null,
    stateCode: 'AZ',
    city: 'Phoenix',
    address: null,
    lat: 33.434166666667,
    lng: -112.01166666667,
    coordinatesSourceId: 'src-wd-sky-harbor',
    summary: "Arizona's largest and busiest airport, three miles from downtown Phoenix and a hub for American Airlines.",
    sections: {
      overview: {
        body: 'Sky Harbor began in 1928 as a private airfield on farmland and was bought by the city of Phoenix in 1935. It now serves the whole metro area and shares its runways with an Arizona Air National Guard refueling wing.',
      },
      operations: {
        facts: [
          fact('Airport code', 'PHX', 'src-wiki-sky-harbor'),
          fact('U.S. rank by passenger boardings', '11th (2025)', 'src-wiki-sky-harbor', '2025-12-31'),
          fact('Airlines', 'Hub for American Airlines; base for Frontier and Southwest', 'src-wiki-sky-harbor'),
          fact('Military', '161st Air Refueling Wing, Arizona Air National Guard', 'src-wiki-sky-harbor'),
        ],
      },
      history: {
        items: [
          'Late 1928: Parker Van Zandt of Scenic Airways founds and builds Sky Harbor',
          '1935: the City of Phoenix buys the airport for $100,000',
          'October 1952: Terminal 1 opens with the first control tower',
          'October 1979: Terminal 3 opens',
        ],
      },
      access: {
        facts: [fact('Distance from downtown Phoenix', '3 miles east', 'src-wiki-sky-harbor')],
      },
    },
    imageIds: ['img-sky-harbor-tower'],
    officialWebsite: 'https://www.skyharbor.com/',
    featured: false,
    sourceIds: ['src-wiki-sky-harbor', 'src-wd-sky-harbor'],
    verificationStatus: 'verified',
    lastVerified: CHECKED,
    createdAt: CHECKED,
  },
];
