import type { Category } from '../types';

/** All 15 categories. Only categories with at least one record are shown in the UI. */
export const categories: Category[] = [
  {
    id: 'tourism-destinations', slug: 'tourism-destinations', name: 'Tourism & Destinations', icon: 'map', order: 1,
    description: 'Places people travel specifically to visit: resort complexes, landmark attractions and destinations built around a single experience.',
  },
  {
    id: 'retail-shopping', slug: 'retail-shopping', name: 'Retail & Shopping', icon: 'shopping-bag', order: 2,
    description: 'The formats of American shopping, from membership warehouses and destination superstores to regional malls.',
  },
  {
    id: 'roadside-travel', slug: 'roadside-travel', name: 'Roadside & Travel Infrastructure', icon: 'fuel', order: 3,
    description: 'Everything built for people on the road: travel centers, truck stops, rest areas and the businesses that grew up along highways.',
  },
  {
    id: 'food-dining', slug: 'food-dining', name: 'Food & Dining', icon: 'utensils', order: 4,
    description: 'Restaurants, diners, food halls and regional food institutions that say something about where they are.',
  },
  {
    id: 'sports-venues', slug: 'sports-venues', name: 'Sports & Venues', icon: 'trophy', order: 5,
    description: 'Stadiums, arenas, speedways and the venues that anchor American sports culture.',
  },
  {
    id: 'nature-wildlife', slug: 'nature-wildlife', name: 'Nature & Wildlife', icon: 'trees', order: 6,
    description: 'Protected landscapes, parks, gardens and places dedicated to wildlife and the natural world.',
  },
  {
    id: 'entertainment-recreation', slug: 'entertainment-recreation', name: 'Entertainment & Recreation', icon: 'ferris-wheel', order: 7,
    description: 'Aquariums, amusement venues and places built for leisure close to home.',
  },
  {
    id: 'communities-living', slug: 'communities-living', name: 'Communities & Living', icon: 'home', order: 8,
    description: 'How Americans organize where they live: planned communities, retirement towns and unconventional settlements.',
  },
  {
    id: 'transportation-aviation', slug: 'transportation-aviation', name: 'Transportation & Aviation', icon: 'plane', order: 9,
    description: 'Airports, seaports, bridges and the infrastructure that moves people and goods.',
  },
  {
    id: 'museums-history-culture', slug: 'museums-history-culture', name: 'Museums, History & Culture', icon: 'landmark', order: 10,
    description: 'Museums, historic districts, architectural landmarks and sites that interpret the past.',
  },
  {
    id: 'education-research', slug: 'education-research', name: 'Education & Research', icon: 'graduation-cap', order: 11,
    description: 'Universities, research centers and places where science and learning are on display.',
  },
  {
    id: 'accommodation-hospitality', slug: 'accommodation-hospitality', name: 'Accommodation & Hospitality', icon: 'bed', order: 12,
    description: 'Hotels, motels, lodges and the many ways America puts up travelers for the night.',
  },
  {
    id: 'agriculture-rural', slug: 'agriculture-rural', name: 'Agriculture & Rural America', icon: 'wheat', order: 13,
    description: 'Farms, ranches, livestock markets and the working landscapes of rural America.',
  },
  {
    id: 'commercial-industrial', slug: 'commercial-industrial', name: 'Commercial & Industrial America', icon: 'factory', order: 14,
    description: 'Ports, plants, distribution hubs and the industrial places that keep the economy running.',
  },
  {
    id: 'unique-unusual', slug: 'unique-unusual', name: 'Unique & Unusual Places', icon: 'sparkles', order: 15,
    description: 'Roadside oddities, landmark motels and places that do not fit neatly anywhere else.',
  },
];
