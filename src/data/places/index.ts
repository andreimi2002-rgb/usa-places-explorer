import type { Place } from '../../types';
import { arizonaPlaces } from './arizona';
import { californiaPlaces } from './california';
import { floridaPlaces } from './florida';
import { orlandoPlaces } from './orlando';
import { texasPlaces } from './texas';

export const places: Place[] = [
  ...floridaPlaces,
  ...orlandoPlaces,
  ...texasPlaces,
  ...arizonaPlaces,
  ...californiaPlaces,
];
