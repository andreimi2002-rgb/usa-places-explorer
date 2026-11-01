import type { Place } from '../../types';
import { arizonaPlaces } from './arizona';
import { californiaPlaces } from './california';
import { floridaPlaces } from './florida';
import { texasPlaces } from './texas';

export const places: Place[] = [
  ...floridaPlaces,
  ...texasPlaces,
  ...arizonaPlaces,
  ...californiaPlaces,
];
