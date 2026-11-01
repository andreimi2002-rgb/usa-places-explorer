import type { LucideIcon } from 'lucide-react';
import {
  BedDouble, Building2, CalendarDays, Container, FerrisWheel, Fuel, History, Info,
  Landmark, MapPinned, Mountain, ParkingSquare, PawPrint, Route, Store, Ticket,
  Users, UtensilsCrossed, Warehouse,
} from 'lucide-react';
import type { PlaceSectionKey } from '../types';

export interface PlaceSectionDefinition {
  title: string;
  icon: LucideIcon;
}

/**
 * Labels and icons for every type-specific section a place page can render.
 * Which sections a place shows (and in which order) is set by
 * `PlaceType.sectionKeys`, so components never branch on the type name.
 */
export const placeSectionDefinitions: Record<PlaceSectionKey, PlaceSectionDefinition> = {
  overview: { title: 'Overview', icon: Info },
  facilities: { title: 'Facilities', icon: Store },
  fuel: { title: 'Fuel', icon: Fuel },
  parking: { title: 'Parking', icon: ParkingSquare },
  food: { title: 'Food', icon: UtensilsCrossed },
  parks: { title: 'Parks', icon: FerrisWheel },
  hotels: { title: 'Hotels', icon: BedDouble },
  attractions: { title: 'Attractions', icon: Ticket },
  landscape: { title: 'Landscape', icon: Mountain },
  wildlife: { title: 'Wildlife', icon: PawPrint },
  visitorCenters: { title: 'Visitor centers', icon: MapPinned },
  cargo: { title: 'What it handles', icon: Container },
  operations: { title: 'Operations', icon: Warehouse },
  architecture: { title: 'Architecture', icon: Building2 },
  exhibits: { title: 'Exhibits', icon: Landmark },
  events: { title: 'Events', icon: CalendarDays },
  history: { title: 'History', icon: History },
  community: { title: 'Community', icon: Users },
  access: { title: 'Getting there', icon: Route },
};
