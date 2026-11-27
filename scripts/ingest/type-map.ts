/**
 * Maps Wikidata class labels (P31 "instance of", English) to the America 360
 * taxonomy. Matching on labels instead of hard-coded Q-ids keeps the rules
 * readable and robust to Wikidata's many near-duplicate classes. Rules are
 * ordered: the first rule matched by any of an item's classes wins.
 */
export type TypeRule = { test: RegExp; category: string; entityType: string; extra?: string[] };

/** Classes that are not encyclopedia entries of their own here (areas, events, people…). */
export const EXCLUDE = /\b(human|city|town|village|hamlet|census-designated|unincorporated community|human settlement|neighbou?rhood|locality|county|consolidated city|tournament|championship|season|battle|siege|election|event|swamp|\bbay\b|cape|channel|sound|cliff|financial district|census tract|zip code|street address|family|surname|given name|taxon|wikimedia)\b/i;

export const RULES: TypeRule[] = [
  { test: /shopping (mall|cent(er|re))|outlet (mall|cent)|lifestyle cent|retail park|power cent/i, category: "shopping-centers", entityType: "shopping_center" },
  { test: /theme park|amusement park|water park/i, category: "theme-parks", entityType: "venue" },
  { test: /\bzoo\b|aquarium/i, category: "zoos-aquariums", entityType: "zoo" },
  { test: /botanical garden|arboretum/i, category: "botanical-gardens", entityType: "botanical_garden" },
  { test: /museum/i, category: "museums", entityType: "museum" },
  { test: /state park/i, category: "state-parks", entityType: "state_park" },
  { test: /national (park|monument|preserve|seashore|memorial|wildlife refuge)|protected area|nature reserve|wildlife (refuge|management)|ecological|state forest|national forest|conservation area/i, category: "protected-areas", entityType: "protected_area" },
  { test: /stadium|ballpark|\barena\b|sports venue|baseball venue|race ?track|speedway|sports complex|velodrome/i, category: "stadiums-arenas", entityType: "venue" },
  { test: /golf (course|club)/i, category: "golf", entityType: "venue" },
  { test: /(american football|baseball|basketball|ice hockey|soccer|association football|rugby|lacrosse|sports|arena football|indoor football) (team|club)|sports team|sports club/i, category: "professional-teams", entityType: "sports_team" },
  { test: /(?<!(business|office|industrial|trailer|technology|research|car|rv|mobile home|corporate|science) )\bpark\b(?! and ride)|garden square|playground|greenway|riverwalk|promenade/i, category: "municipal-parks", entityType: "park" },
  { test: /trail\b/i, category: "trails", entityType: "trail" },
  { test: /university|universit/i, category: "universities", entityType: "university" },
  { test: /school district/i, category: "school-districts", entityType: "school_district" },
  { test: /college|seminary|institute of technology|business school|law school|medical school|school of |graduate school|faculty|academic institution/i, category: "colleges", entityType: "college" },
  { test: /school/i, category: "k12-schools", entityType: "school" },
  { test: /librar/i, category: "public-libraries", entityType: "library" },
  { test: /hospital|medical cent|clinic|health system|trauma cent/i, category: "hospitals", entityType: "hospital" },
  { test: /naval air station|naval station|air force base|military (base|installation)|army base|coast guard station|marine corps/i, category: "military-installations", entityType: "military_installation" },
  { test: /airport|airfield|air station/i, category: "airports", entityType: "airport" },
  { test: /seaport|\bport\b|harbou?r|marine terminal|cruise terminal/i, category: "seaports", entityType: "seaport" },
  { test: /bridge/i, category: "bridges", entityType: "bridge" },
  { test: /interstate highway|interstate/i, category: "interstates", entityType: "highway" },
  { test: /highway|expressway|parkway|state road|road\b|boulevard|beltway/i, category: "highways", entityType: "highway" },
  { test: /railway station|train station|bus station|monorail station|elevated station|transit (station|center|centre)|metro station|light rail station|people mover/i, category: "public-transit", entityType: "transit_station" },
  { test: /public transport|transit (agency|authority|system)/i, category: "public-transit", entityType: "transit_agency" },
  { test: /railroad|railway (company|line)|rail line/i, category: "freight-rail", entityType: "company" },
  { test: /lighthouse/i, category: "landmarks", entityType: "lighthouse" },
  { test: /fort\b|fortification|historic site|archaeological site|battlefield|national historic landmark|plantation|shipwreck/i, category: "historic-sites", entityType: "historic_site" },
  { test: /historic district/i, category: "historic-districts", entityType: "historic_site" },
  { test: /cemetery|graveyard|mausoleum/i, category: "cemeteries", entityType: "cemetery" },
  { test: /church|cathedral|basilica|synagogue|mosque|temple|chapel|place of worship|parish|congregation|abbey|monastery/i, category: "places-of-worship", entityType: "place_of_worship" },
  { test: /monument|memorial|statue|fountain|sculpture|obelisk|public art/i, category: "monuments", entityType: "landmark" },
  { test: /theat(re|er) building|theat(re|er)|concert hall|performing arts|amphitheat|opera house|music venue|auditorium/i, category: "performing-arts", entityType: "venue" },
  { test: /movie theat|cinema|drive-in/i, category: "cinemas", entityType: "venue" },
  { test: /radio station|television station|tv station|newspaper|magazine|broadcast|media company/i, category: "media-outlets", entityType: "media_outlet" },
  { test: /hotel|resort|motel|inn\b/i, category: "hotels-lodging", entityType: "hotel" },
  { test: /\bhouse\b|mansion|residence|villa|cottage|bungalow|homestead|single-family/i, category: "historic-buildings", entityType: "historic_site" },
  { test: /skyscraper|high-rise|office building|tower|commercial building|building|structure/i, category: "notable-buildings", entityType: "building" },
  { test: /river|creek|stream|watercourse|canal|estuary/i, category: "waterways", entityType: "waterway" },
  { test: /lake|reservoir|pond|spring\b/i, category: "waterways", entityType: "waterway" },
  { test: /island/i, category: "islands", entityType: "island" },
  { test: /beach/i, category: "coastlines-beaches", entityType: "beach" },
  { test: /power (station|plant)|substation|water treatment|landfill/i, category: "utilities", entityType: "building" },
  { test: /sheriff|police/i, category: "law-enforcement", entityType: "law_enforcement_agency" },
  { test: /fire (department|station)/i, category: "fire-rescue", entityType: "fire_rescue_agency" },
  { test: /government agency|authority|state agency|city council|municipal government|county government|court/i, category: "local-government", entityType: "agency" },
  { test: /bank\b|insurance|financial/i, category: "financial-technology", entityType: "company" },
  { test: /restaurant chain|fast food|supermarket chain|retail chain|chain store|brand/i, category: "retail-chains", entityType: "brand" },
  { test: /restaurant|diner|caf[eé]|bakery|bar\b|brewery/i, category: "restaurants", entityType: "restaurant" },
  { test: /company|business|enterprise|corporation|conglomerate|manufacturer|privately held|public company|subsidiary/i, category: "corporate-headquarters", entityType: "company" },
  { test: /nonprofit|non-profit|charity|foundation|association|organi[sz]ation|society|club\b/i, category: "community-organizations", entityType: "organization" },
];

export function classify(classLabels: string[]): { rule: TypeRule; matchedLabel: string } | null {
  for (const rule of RULES) {
    const hit = classLabels.find((l) => rule.test.test(l));
    if (hit) return { rule, matchedLabel: hit };
  }
  return null;
}

/** OSM tags of brand locations -> brand category (+ secondary category). */
export function brandCategory(tags: Record<string, string>): { primary: string; secondary?: string } {
  const a = tags.amenity;
  const s = tags.shop;
  if (a === "fast_food") return { primary: "restaurant-chains", secondary: "fast-food" };
  if (a === "restaurant") return { primary: "restaurant-chains", secondary: "restaurants" };
  if (a === "cafe") return { primary: "restaurant-chains", secondary: "cafes" };
  if (a === "ice_cream") return { primary: "restaurant-chains", secondary: "ice-cream-desserts" };
  if (a === "fuel" || a === "charging_station") return { primary: "fuel-brands", secondary: a === "fuel" ? "gas-stations" : "ev-charging" };
  if (a === "bank" || a === "atm" || a === "bureau_de_change") return { primary: "bank-brands" };
  if (a === "pharmacy" || s === "chemist") return { primary: "retail-chains", secondary: "specialty-stores" };
  if (tags.tourism === "hotel" || tags.tourism === "motel" || tags.tourism === "guest_house") return { primary: "other-brands", secondary: "hotels-lodging" };
  if (a === "car_rental") return { primary: "other-brands", secondary: "dealerships" };
  if (tags.leisure === "fitness_centre") return { primary: "other-brands", secondary: "local-sports" };
  if (s === "supermarket" || s === "grocery") return { primary: "retail-chains", secondary: "supermarkets" };
  if (s === "convenience") return { primary: "retail-chains", secondary: "convenience-stores" };
  if (s === "department_store" || s === "variety_store" || s === "wholesale") return { primary: "retail-chains", secondary: "supercenters" };
  if (s === "hardware" || s === "doityourself") return { primary: "retail-chains", secondary: "hardware-stores" };
  if (s === "electronics" || s === "mobile_phone" || s === "computer") return { primary: "retail-chains", secondary: "electronics-stores" };
  if (s === "pet") return { primary: "retail-chains", secondary: "pet-stores" };
  if (s === "sports" || s === "outdoor") return { primary: "retail-chains", secondary: "outdoor-sporting-goods" };
  if (s === "shoes" || s === "clothes") return { primary: "retail-chains", secondary: "specialty-stores" };
  if (s === "furniture") return { primary: "retail-chains", secondary: "home-furnishings" };
  if (s === "second_hand" || s === "charity") return { primary: "retail-chains", secondary: "thrift-stores" };
  if (s === "car" || s === "car_repair" || s === "car_parts" || s === "tyres") return { primary: "other-brands", secondary: s === "car_parts" ? "auto-parts" : s === "car" ? "dealerships" : "auto-repair" };
  if (a === "car_wash") return { primary: "other-brands", secondary: "car-washes" };
  if (s) return { primary: "retail-chains", secondary: "specialty-stores" };
  return { primary: "other-brands" };
}
