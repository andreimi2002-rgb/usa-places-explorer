import type { Source } from '../types';

/**
 * Every source below was fetched and read on the `accessed` date.
 * Ids are referenced from other data files.
 */
export const sources: Source[] = [
  // --- Brands: Love's -------------------------------------------------------
  { id: 'src-loves-about', title: 'About Us', publisher: "Love's Travel Stops", url: 'https://www.loves.com/en/about-us', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-loves', title: "Love's Travel Stops & Country Stores (Q1872496)", publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q1872496', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Buc-ee's -----------------------------------------------------
  { id: 'src-bucees-about', title: 'About', publisher: "Buc-ee's", url: 'https://www.buc-ees.com/about/', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-bucees-locations', title: 'Locations', publisher: "Buc-ee's", url: 'https://buc-ees.com/locations/', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-bucees', title: "Buc-ee's (Q4982335)", publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q4982335', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Pilot Flying J -----------------------------------------------
  { id: 'src-pilot-about', title: 'About Us', publisher: 'Pilot Company', url: 'https://pilotcompany.com/about-us', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-pilot', title: 'Pilot Flying J (Q1434601)', publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q1434601', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Bass Pro Shops -----------------------------------------------
  { id: 'src-basspro-about', title: 'The Bass Pro Shops Story', publisher: 'Bass Pro Shops', url: 'https://about.basspro.com/', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-basspro-college-station', title: 'Bass Pro Shops announces plans for new Outdoor World location in College Station, Texas (Aug. 27, 2026)', publisher: 'Bass Pro Shops', url: 'https://about.basspro.com/wp-content/uploads/2026/08/College-Station-Announcement_Final.pdf', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-basspro', title: 'Bass Pro Shops (Q4867953)', publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q4867953', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Costco -------------------------------------------------------
  { id: 'src-costco-sales-2026-09', title: 'Costco Wholesale Corporation Reports September Sales Results (Oct. 7, 2026)', publisher: 'Costco Wholesale Corporation', url: 'https://s201.q4cdn.com/287523651/files/doc_news/Costco-Wholesale-Corporation-Reports-September-Sales-Results-2026.pdf', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-costco', title: 'Costco (Q715583)', publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q715583', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Universal ----------------------------------------------------
  { id: 'src-wiki-udx', title: 'Universal Destinations & Experiences', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Universal_Destinations_%26_Experiences', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-nbcu-kids-resort-open', title: 'Universal Kids Resort: First-Ever Theme Park for Young Children Now Officially Open (July 2, 2026)', publisher: 'NBCUniversal', url: 'https://www.nbcuniversal.com/article/universal-kids-resort-first-ever-theme-park-young-children-now-officially-open', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wd-udx', title: 'Universal Destinations & Experiences (Q1186857)', publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q1186857', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Brands: Disney Parks -------------------------------------------------
  { id: 'src-disney-experiences', title: 'Disney Experiences', publisher: 'The Walt Disney Company', url: 'https://disneyexperiences.com/', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wiki-disney-experiences', title: 'Disney Experiences', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Disney_Experiences', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-wd-disney-experiences', title: 'Disney Experiences (Q1431781)', publisher: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q1431781', kind: 'wikidata', accessed: '2026-11-01' },

  // --- Place types ----------------------------------------------------------
  { id: 'src-natso-about', title: 'About NATSO', publisher: 'NATSO', url: 'https://www.natso.com/about', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-wiki-truck-stop', title: 'Truck stop', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Truck_stop', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-wiki-theme-park', title: 'Amusement park (theme parks)', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Theme_park', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-wiki-big-box', title: 'Big-box store', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Big-box_store', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-wiki-warehouse-club', title: 'Warehouse club', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Warehouse_club', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-wiki-planned-community', title: 'Planned community', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Planned_community', kind: 'wikipedia', accessed: '2026-11-01' },
  { id: 'src-nps-faq', title: 'Frequently Asked Questions', publisher: 'National Park Service', url: 'https://www.nps.gov/aboutus/faqs.htm', kind: 'government', accessed: '2026-11-01' },
  { id: 'src-nps-route66-overview', title: 'Route 66 Overview', publisher: 'National Park Service', url: 'https://www.nps.gov/articles/route-66-overview.htm', kind: 'government', accessed: '2026-11-01' },
  { id: 'src-nps-route66-program', title: 'Route 66 Corridor Preservation Program', publisher: 'National Park Service', url: 'https://www.nps.gov/orgs/1453/rosi.htm', kind: 'government', accessed: '2026-11-01' },

  // --- Place types added in Phase 3 (Wikipedia concept articles) ------------
  ...[
    ['src-wiki-port', 'Port', 'Port'],
    ['src-wiki-airport', 'Airport', 'Airport'],
    ['src-wiki-stadium', 'Stadium', 'Stadium'],
    ['src-wiki-race-track', 'Race track', 'Race_track'],
    ['src-wiki-botanical-garden', 'Botanical garden', 'Botanical_garden'],
    ['src-wiki-public-aquarium', 'Public aquarium', 'Public_aquarium'],
    ['src-wiki-shopping-mall', 'Shopping mall', 'Shopping_mall'],
    ['src-wiki-roadside-attraction', 'Roadside attraction', 'Roadside_attraction'],
    ['src-wiki-nhl', 'National Historic Landmark', 'National_Historic_Landmark'],
    ['src-wiki-off-the-grid', 'Off-the-grid', 'Off-the-grid'],
    ['src-wiki-suspension-bridge', 'Suspension bridge', 'Suspension_bridge'],
    ['src-wiki-visitor-center', 'Visitor center', 'Visitor_center'],
  ].map(([id, title, path]) => wikipedia(id!, title!, path!)),

  // --- Phase 4: concepts behind the imported listing types ------------------
  ...[
    ['src-wiki-national-monument', 'National monument (United States)', 'National_monument_(United_States)'],
    ['src-wiki-state-park', 'State park', 'State_park'],
    ['src-wiki-nwr', 'National Wildlife Refuge', 'National_Wildlife_Refuge'],
    ['src-wiki-zoo', 'Zoo', 'Zoo'],
    ['src-wiki-spring', 'Spring (hydrology)', 'Spring_(hydrology)'],
    ['src-wiki-cave', 'Cave', 'Cave'],
    ['src-wiki-museum', 'Museum', 'Museum'],
    ['src-wiki-art-museum', 'Art museum', 'Art_museum'],
    ['src-wiki-ca-missions', 'Spanish missions in California', 'Spanish_missions_in_California'],
    ['src-wiki-fortification', 'Fortification', 'Fortification'],
    ['src-wiki-ghost-town', 'Ghost town', 'Ghost_town'],
    ['src-wiki-lighthouse', 'Lighthouse', 'Lighthouse'],
    ['src-wiki-hotel', 'Hotel', 'Hotel'],
    ['src-wiki-restaurant', 'Restaurant', 'Restaurant'],
    ['src-wiki-amusement-park', 'Amusement park', 'Amusement_park'],
    ['src-wiki-pier', 'Pier', 'Pier'],
    ['src-wiki-pac', 'Performing arts center', 'Performing_arts_center'],
    ['src-wiki-dam', 'Dam', 'Dam'],
    ['src-wiki-winery', 'Winery', 'Winery'],
    ['src-wiki-california-wine', 'California wine', 'California_wine'],
    ['src-wiki-ranch', 'Ranch', 'Ranch'],
    ['src-wiki-university', 'University', 'University'],
  ].map(([id, title, path]) => ({ ...wikipedia(id!, title!, path!), accessed: '2026-11-02' })),

  // --- Places: Wikipedia articles ------------------------------------------
  ...[
    ['src-wiki-universal-orlando', 'Universal Orlando', 'Universal_Orlando'],
    ['src-wiki-ksc-visitor-complex', 'Kennedy Space Center Visitor Complex', 'Kennedy_Space_Center_Visitor_Complex'],
    ['src-wiki-the-villages', 'The Villages, Florida', 'The_Villages,_Florida'],
    ['src-wiki-daytona-speedway', 'Daytona International Speedway', 'Daytona_International_Speedway'],
    ['src-wiki-everglades', 'Everglades National Park', 'Everglades_National_Park'],
    ['src-wiki-bucees', "Buc-ee's", 'Buc-ee%27s'],
    ['src-wiki-att-stadium', 'AT&T Stadium', 'AT%26T_Stadium'],
    ['src-wiki-fw-stockyards', 'Fort Worth Stockyards', 'Fort_Worth_Stockyards'],
    ['src-wiki-port-houston', 'Port of Houston', 'Port_of_Houston'],
    ['src-wiki-space-center-houston', 'Space Center Houston', 'Space_Center_Houston'],
    ['src-wiki-grand-canyon', 'Grand Canyon National Park', 'Grand_Canyon_National_Park'],
    ['src-wiki-wigwam-motel', 'Wigwam Motel', 'Wigwam_Motel'],
    ['src-wiki-taliesin-west', 'Taliesin West', 'Taliesin_West'],
    ['src-wiki-desert-botanical-garden', 'Desert Botanical Garden', 'Desert_Botanical_Garden'],
    ['src-wiki-sky-harbor', 'Phoenix Sky Harbor International Airport', 'Phoenix_Sky_Harbor_International_Airport'],
    ['src-wiki-disneyland-resort', 'Disneyland Resort', 'Disneyland_Resort'],
    ['src-wiki-golden-gate', 'Golden Gate Bridge', 'Golden_Gate_Bridge'],
    ['src-wiki-port-la', 'Port of Los Angeles', 'Port_of_Los_Angeles'],
    ['src-wiki-monterey-aquarium', 'Monterey Bay Aquarium', 'Monterey_Bay_Aquarium'],
    ['src-wiki-cabazon', 'Cabazon Dinosaurs', 'Cabazon_Dinosaurs'],
    ['src-wiki-slab-city', 'Slab City, California', 'Slab_City,_California'],
    ['src-wiki-south-coast-plaza', 'South Coast Plaza', 'South_Coast_Plaza'],
  ].map(([id, title, path]) => wikipedia(id!, title!, path!)),

  // --- Places: Wikidata items (coordinates, dates, official websites) ------
  ...[
    ['src-wd-universal-orlando', 'Universal Orlando Resort', 'Q778011'],
    ['src-wd-ksc-visitor-complex', 'Kennedy Space Center Visitor Complex', 'Q6389687'],
    ['src-wd-the-villages', 'The Villages', 'Q279537'],
    ['src-wd-daytona-speedway', 'Daytona International Speedway', 'Q1179250'],
    ['src-wd-everglades', 'Everglades National Park', 'Q274131'],
    ['src-wd-att-stadium', 'AT&T Stadium', 'Q838284'],
    ['src-wd-fw-stockyards', 'Fort Worth Stockyards', 'Q1895076'],
    ['src-wd-port-houston', 'Port of Houston', 'Q1921365'],
    ['src-wd-space-center-houston', 'Space Center Houston', 'Q2749172'],
    ['src-wd-grand-canyon', 'Grand Canyon National Park', 'Q220289'],
    ['src-wd-taliesin-west', 'Taliesin West', 'Q1208310'],
    ['src-wd-desert-botanical-garden', 'Desert Botanical Garden', 'Q2566136'],
    ['src-wd-sky-harbor', 'Phoenix Sky Harbor International Airport', 'Q912916'],
    ['src-wd-disneyland-resort', 'Disneyland Resort', 'Q1229066'],
    ['src-wd-golden-gate', 'Golden Gate Bridge', 'Q44440'],
    ['src-wd-port-la', 'Port of Los Angeles', 'Q1308991'],
    ['src-wd-monterey-aquarium', 'Monterey Bay Aquarium', 'Q1754233'],
    ['src-wd-cabazon', 'Cabazon Dinosaurs', 'Q5015264'],
    ['src-wd-slab-city', 'Slab City', 'Q1017618'],
    ['src-wd-south-coast-plaza', 'South Coast Plaza', 'Q1027465'],
  ].map(([id, label, qid]) => wikidata(id!, label!, qid!)),

  // --- Places: official pages, news and OpenStreetMap ----------------------
  { id: 'src-loves-italy-store', title: "Love's Travel Stop in Italy, TX (Store #628)", publisher: "Love's Travel Stops", url: 'https://www.loves.com/locations/tx/italy/loves-travel-stop-italy-628', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-basspro-grapevine-store', title: 'Bass Pro Shops Grapevine, TX', publisher: 'Bass Pro Shops', url: 'https://stores.basspro.com/us/tx/grapevine/2501-bass-pro-dr.html', kind: 'official', accessed: '2026-11-01' },
  { id: 'src-fox10-bucees-goodyear', title: "'God bless America': Buc-ee's officially opens in Goodyear (June 22, 2026)", publisher: 'FOX 10 Phoenix', url: 'https://www.fox10phoenix.com/news/god-bless-america-buc-ees-officially-opens-goodyear', kind: 'news', accessed: '2026-11-01' },
  { id: 'src-osm-bucees-daytona', title: "Buc-ee's, 2330 Gateway North Drive (way 1092384508)", publisher: 'OpenStreetMap', url: 'https://www.openstreetmap.org/way/1092384508', kind: 'openstreetmap', accessed: '2026-11-01' },
  { id: 'src-osm-bucees-goodyear', title: "Buc-ee's, 1001 North Bullard Avenue (way 1531456081)", publisher: 'OpenStreetMap', url: 'https://www.openstreetmap.org/way/1531456081', kind: 'openstreetmap', accessed: '2026-11-01' },
  { id: 'src-osm-basspro-grapevine', title: 'Bass Pro Shops, 2501 Bass Pro Drive (way 30264059)', publisher: 'OpenStreetMap', url: 'https://www.openstreetmap.org/way/30264059', kind: 'openstreetmap', accessed: '2026-11-01' },
];

function wikipedia(id: string, title: string, path: string): Source {
  return { id, title, publisher: 'Wikipedia', url: `https://en.wikipedia.org/wiki/${path}`, kind: 'wikipedia', accessed: '2026-11-01' };
}

function wikidata(id: string, label: string, qid: string): Source {
  return { id, title: `${label} (${qid})`, publisher: 'Wikidata', url: `https://www.wikidata.org/wiki/${qid}`, kind: 'wikidata', accessed: '2026-11-01' };
}
