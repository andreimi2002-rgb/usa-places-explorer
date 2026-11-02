export interface NavItem {
  label: string;
  to: string;
  /** Match only the exact path (used for Home). */
  end?: boolean;
}

export const mainNavItems: NavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'Place Types', to: '/types' },
  { label: 'Brands', to: '/brands' },
  { label: 'States', to: '/states' },
  { label: 'Cities', to: '/cities' },
  { label: 'Collections', to: '/collections' },
  { label: 'Map', to: '/map' },
  { label: 'About', to: '/about' },
];
