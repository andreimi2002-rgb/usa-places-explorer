import type { City } from '../types';

/**
 * City areas covered in depth. A place belongs to a city area when its
 * coordinates fall in one of the area's counties (U.S. Census geocoder).
 */
export const cities: City[] = [
  {
    id: 'city-orlando',
    slug: 'orlando',
    name: 'Orlando',
    areaName: 'Greater Orlando',
    stateCode: 'FL',
    intro:
      'Greater Orlando, officially the Orlando–Kissimmee–Sanford metro area, spreads across four counties in inland Central Florida. It is best known for its theme parks: Walt Disney World lies southwest of the city in Bay Lake, and Universal Orlando is the only theme park resort inside city limits. Away from the parks, downtown Orlando holds the main museums, arts venues and nightlife, International Drive gathers big attractions, and the region is home to one of the largest universities in the country.',
    countyFips: ['12069', '12095', '12097', '12117'],
    countyNames: ['Lake County', 'Orange County', 'Osceola County', 'Seminole County'],
    population: { value: 2673376, sourceId: 'src-wiki-greater-orlando', asOf: '2020-04-01', note: '2020 census, metro area' },
    areaSqMi: { value: 4012, sourceId: 'src-wiki-greater-orlando', asOf: '2026-11-02', note: 'land and water, metro area' },
    center: { lat: 28.48, lng: -81.42, zoom: 10 },
    heroImageId: 'img-lake-eola',
    sourceIds: ['src-wiki-greater-orlando', 'src-wiki-orlando'],
    createdAt: '2026-11-02',
  },
];
