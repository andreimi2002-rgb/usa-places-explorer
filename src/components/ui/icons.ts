import type { LucideIcon } from 'lucide-react';
import {
  BedDouble, Factory, FerrisWheel, Fuel, GraduationCap, House, Landmark, Map,
  Plane, ShoppingBag, Sparkles, Trees, Trophy, UtensilsCrossed, Wheat,
} from 'lucide-react';
import type { IconName } from '../../types';

/** Maps icon names stored in data to Lucide components. */
export const categoryIcons: Record<IconName, LucideIcon> = {
  map: Map,
  'shopping-bag': ShoppingBag,
  fuel: Fuel,
  utensils: UtensilsCrossed,
  trophy: Trophy,
  trees: Trees,
  'ferris-wheel': FerrisWheel,
  home: House,
  plane: Plane,
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  bed: BedDouble,
  wheat: Wheat,
  factory: Factory,
  sparkles: Sparkles,
};
