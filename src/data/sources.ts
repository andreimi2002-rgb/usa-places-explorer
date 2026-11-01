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
];
