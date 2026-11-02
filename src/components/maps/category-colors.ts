/**
 * One marker color per category, chosen to stay distinguishable on the
 * OpenStreetMap base map. Shared by maps and their legends.
 */
const COLORS: Record<string, string> = {
  'tourism-destinations': '#C2410C',
  'retail-shopping': '#7C3AED',
  'roadside-travel': '#B45309',
  'food-dining': '#DB2777',
  'sports-venues': '#2563EB',
  'nature-wildlife': '#15803D',
  'entertainment-recreation': '#E11D48',
  'communities-living': '#0F766E',
  'transportation-aviation': '#475569',
  'museums-history-culture': '#92400E',
  'education-research': '#4338CA',
  'accommodation-hospitality': '#0E7490',
  'agriculture-rural': '#65A30D',
  'commercial-industrial': '#57534E',
  'unique-unusual': '#A21CAF',
};

export const categoryColor = (categoryId: string | undefined) => (categoryId && COLORS[categoryId]) || '#17325C';
