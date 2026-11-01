import type { State } from '../types';

/**
 * States are data, not pages. To add a state later, append a record here
 * (set `active: true`) and add a places file under `data/places/`.
 * Intros are editorial and deliberately contain no statistics.
 */
export const states: State[] = [
  {
    code: 'FL',
    slug: 'florida',
    name: 'Florida',
    intro:
      'A peninsula shaped by water and by visitors. Florida pairs subtropical wetlands and long coastlines with some of the most deliberately designed places in the country: resort complexes, planned towns and launch sites.',
    heroImageId: null,
    active: true,
  },
  {
    code: 'TX',
    slug: 'texas',
    name: 'Texas',
    intro:
      'Distance defines Texas. Long highways connect its cities, and the places built along them (oversized travel centers, stadiums, stockyards and Gulf ports) tend to match the scale of the state itself.',
    heroImageId: null,
    active: true,
  },
  {
    code: 'AZ',
    slug: 'arizona',
    name: 'Arizona',
    intro:
      'Desert, canyon and highway. Arizona brings together dramatic public lands, a fast-growing metropolitan core, and remnants of old Route 66 roadside culture in its northern towns.',
    heroImageId: null,
    active: true,
  },
  {
    code: 'CA',
    slug: 'california',
    name: 'California',
    intro:
      'A state of many landscapes and many economies. California holds landmark engineering, major seaports, a long coastline, desert oddities and some of the places that defined American theme parks and shopping.',
    heroImageId: null,
    active: true,
  },
];
