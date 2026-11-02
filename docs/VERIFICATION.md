# Data verification log

Every record in `src/data/` is listed here with its verification status and what is still missing.

- **verified**: every factual field shown is backed by a cited source.
- **partial**: core facts verified; some fields are `null`, or the text includes typical-case generalizations (e.g. comparison tables).
- **unverified**: record exists but details are not yet confirmed.

Sources are preferred in this order: official website → Wikidata → Wikipedia → reputable news.
All sources were fetched and read on the date shown in `src/data/sources.ts`.

_Last updated: 2026-11-02 (Phase 4)._

## Brands

| Record | Status | Last verified | Key facts and sources | Missing / notes |
|---|---|---|---|---|
| Buc-ee's | verified | 2026-11-01 | Founded 1982 (official About page); HQ Lake Jackson, TX (Wikidata); 57 locations in 14 states, 36 in Texas (counted from the official Locations page) | Location count is our count of the official list on 2026-11-01, not a figure the company states. |
| Love's | verified | 2026-11-01 | Founded 1964, HQ Oklahoma City, 681 locations in 42 states, 430+ truck service centers (official About page) | All locations are in the U.S., so no worldwide figure. |
| Pilot Flying J | partial | 2026-11-01 | Pilot founded 1958, Flying J merger 2010, 900+ locations in 43 states and 5 Canadian provinces, Berkshire Hathaway ownership (official About page); HQ Knoxville (Wikidata) | **U.S.-only location count not published**, so it shows "Not yet verified". |
| Bass Pro Shops | partial | 2026-11-01 | Founded 1972, 183 locations across North America incl. Cabela's (press release, Aug 27 2026); HQ Springfield, MO (Wikidata) | **U.S.-only count not published.** Wikidata lists inception as 1971; the company's own materials say 1972, which we use. |
| Costco | verified | 2026-11-01 | 939 warehouses, 647 in U.S. and Puerto Rico (Sept 2026 sales release, Oct 7 2026); founded 1983, HQ Issaquah (Wikidata) | The U.S. figure includes Puerto Rico, as reported by Costco. |
| Universal | partial | 2026-11-01 | Universal Studios Hollywood opened 1964, HQ Orlando, parks in Japan and Beijing, licensed Singapore (Wikipedia); Universal Kids Resort opened July 2026 (NBCUniversal) | **No official count of destinations found.** The U.S. figure (3: Hollywood, Orlando, Frisco) is our count from Wikipedia + NBCUniversal. Worldwide count left `null`. The official site udx.com could not be read. |
| Disney Parks | verified | 2026-11-01 | Disneyland opened July 1955; 6 resort destinations, 12 theme parks; Walt Disney World: six theme and water parks, nearly 29,000 hotel rooms (disneyexperiences.com); HQ Lake Buena Vista FL and Glendale CA (Wikipedia) | Official page is undated; "as of" is the date we read it. |

## Place types

Place type pages are explanatory. Definitions are written for this atlas from the cited sources. Comparison tables and "anatomy" lists describe *typical* sites, so most types are marked `partial`.

| Record | Status | Last verified | Sources | Notes |
|---|---|---|---|---|
| Travel Center | partial | 2026-11-01 | Wikipedia (Truck stop), NATSO, Love's, Buc-ee's | Comparison table is a typical-case generalization. |
| Theme Park Resort | partial | 2026-11-01 | Wikipedia (Theme park, Universal D&E), Disney Experiences, NBCUniversal | Comparison table is a typical-case generalization. |
| Outdoor Superstore | partial | 2026-11-01 | Bass Pro Shops press release and About page, Wikipedia (Big-box store) | Format described mainly from Bass Pro Shops' own materials. |
| Warehouse Club | partial | 2026-11-01 | Wikipedia (Warehouse club), Costco sales release | Comparison table is a typical-case generalization. |
| Master-Planned Community | partial | 2026-11-01 | Wikipedia (Planned community) | Only one general source so far. The Villages (Phase 3) will add a concrete, sourced example. |
| National Park | partial | 2026-11-01 | NPS FAQ (434 areas, NPS created 1916, Yellowstone 1872) | The commonly cited "63 national parks" figure is **not used**: we could not confirm it on nps.gov. |
| Route 66 Landmark | verified | 2026-11-01 | NPS Route 66 Overview (1926, ~2,400 miles, 8 states, decommissioned 1985), NPS Corridor Preservation Program (1999 act, 1926–1985 period) | — |
| Seaport | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Airport | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Sports Venue | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Space Center Visitor Complex | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Landmark Bridge | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Public Garden & Aquarium | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Regional Mall | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Roadside Attraction | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Historic Landmark | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| Off-Grid Community | partial | 2026-11-01 | Wikipedia concept article + the place articles it covers | Added in Phase 3; shorter page without a comparison table. |
| National Monument | partial | 2026-11-02 | Wikipedia (National monument (United States)) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| State Park | partial | 2026-11-02 | Wikipedia (State park) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| National Wildlife Refuge | partial | 2026-11-02 | Wikipedia (National Wildlife Refuge) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Zoo | partial | 2026-11-02 | Wikipedia (Zoo) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Natural Spring | partial | 2026-11-02 | Wikipedia (Spring (hydrology)) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Cave | partial | 2026-11-02 | Wikipedia (Cave) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Museum | partial | 2026-11-02 | Wikipedia (Museum) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Art Museum | partial | 2026-11-02 | Wikipedia (Art museum) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| California Mission | partial | 2026-11-02 | Wikipedia (Spanish missions in California) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Historic Fort | partial | 2026-11-02 | Wikipedia (Fortification) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Ghost Town | partial | 2026-11-02 | Wikipedia (Ghost town) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Lighthouse | partial | 2026-11-02 | Wikipedia (Lighthouse) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Landmark Hotel | partial | 2026-11-02 | Wikipedia (Hotel) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Landmark Restaurant | partial | 2026-11-02 | Wikipedia (Restaurant) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Amusement Park | partial | 2026-11-02 | Wikipedia (Amusement park) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Pier | partial | 2026-11-02 | Wikipedia (Pier) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Performing Arts Venue | partial | 2026-11-02 | Wikipedia (Performing arts center) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Dam | partial | 2026-11-02 | Wikipedia (Dam) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Winery | partial | 2026-11-02 | Wikipedia (Winery, California wine) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| Ranch | partial | 2026-11-02 | Wikipedia (Ranch) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |
| University Campus | partial | 2026-11-02 | Wikipedia (University) | Added in Phase 4 for imported listings. General definition only; "where common" lines refer to this atlas's own data unless the source says more. |

## Images

All 38 images are from Wikimedia Commons. For each one we fetched the file page metadata (author, license, size), checked the image by eye to confirm it shows the named place, and confirmed the URL loads. Rejected: `02178 Grand Canyon Mather Point` (a group of people is the main subject), `Costco Wholesale Club.jpg` (location not identified) and `Greg Abbott Buc-ee's Luling Texas 2024.jpg` (a person is the main subject).

## Places

All 26 research targets were published (none skipped). Text is written for this atlas; every fact in a place section carries its own source and date.

**Coordinates.** Taken from Wikidata where available. For stores missing from Wikidata, we used the store's official page (Love's) or **OpenStreetMap** (Buc-ee's Daytona Beach and Goodyear, Bass Pro Shops Grapevine), only where the OSM feature has the same brand and the same street address as the official source. OSM use was approved by the project owner on 2026-11-01. For large areas (parks, ports, districts, communities) the Wikidata point marks the area, not a single entrance.

**Address.** Shown only when an official page or Wikipedia infobox gives it. For areas (parks, ports, resorts, districts, communities, airports) a single street address does not apply and the field stays empty.

| Place | State | Status | Last verified | Main sources | Missing / notes |
|---|---|---|---|---|---|
| Universal Orlando Resort | FL | verified | 2026-11-01 | Wikipedia, Wikidata | Address n/a (resort area). |
| Kennedy Space Center Visitor Complex | FL | verified | 2026-11-01 | Wikipedia, Wikidata | Street address not sourced; located on Merritt Island. |
| The Villages | FL | verified | 2026-11-01 | Wikipedia, Wikidata | Population is the 2020 census figure for the CDP only. |
| Daytona International Speedway | FL | verified | 2026-11-01 | Wikipedia (infobox address), Wikidata | — |
| Everglades National Park | FL | verified | 2026-11-01 | Wikipedia, Wikidata | Visitor centers not listed yet (no clean source fetched). |
| Buc-ee's Daytona Beach | FL | verified | 2026-11-01 | Buc-ee's Locations page, Wikipedia (opening date), OSM (coordinates) | — |
| Buc-ee's Luling | TX | **partial** | 2026-11-01 | Buc-ee's Locations page, Wikipedia | **No coordinates**: not in Wikidata, Wikipedia or OpenStreetMap, so no map marker. Photos show the original store (2008), since replaced. |
| Love's Travel Stop, Italy (Store #628) | TX | verified | 2026-11-01 | Official store page (address, coordinates, amenities) | Chosen because the official page lists full details and a Commons photo exists. Opening year (2015) **not used**: the official news page could no longer be read. |
| Bass Pro Shops Grapevine | TX | verified | 2026-11-01 | Official store page, OSM (coordinates) | **No photo** on Commons, so a placeholder is shown. The brief called it "Outdoor World"; the official page does not use that name. Opening year not found. |
| AT&T Stadium | TX | verified | 2026-11-01 | Wikipedia (infobox address), Wikidata | ZIP code not sourced. |
| Fort Worth Stockyards | TX | verified | 2026-11-01 | Wikipedia, Wikidata | Address n/a (historic district). |
| Port of Houston | TX | verified | 2026-11-01 | Wikipedia, Wikidata | Address n/a; coordinates are the Wikidata point near Barbours Cut. Rankings ("busiest") deliberately not shown. |
| Space Center Houston | TX | verified | 2026-11-01 | Wikipedia (infobox address), Wikidata | — |
| Grand Canyon National Park | AZ | verified | 2026-11-01 | Wikipedia, Wikidata | Visitor numbers are for 2024. |
| Buc-ee's Goodyear | AZ | verified | 2026-11-01 | FOX 10 Phoenix (opening, size, pumps), Buc-ee's Locations page, OSM (coordinates) | Size and pump count are as reported at opening (June 22, 2026). |
| Wigwam Motel, Holbrook | AZ | verified | 2026-11-01 | Wikipedia (infobox address and coordinates) | No Wikidata item for this motel; official website not sourced. |
| Taliesin West | AZ | **partial** | 2026-11-01 | Wikipedia, Wikidata | Street address and official website not sourced. |
| Desert Botanical Garden | AZ | verified | 2026-11-01 | Wikipedia (address), Wikidata | ZIP code not sourced. |
| Phoenix Sky Harbor International Airport | AZ | verified | 2026-11-01 | Wikipedia, Wikidata | Rank (11th by boardings) is for 2025. |
| Disneyland Resort | CA | verified | 2026-11-01 | Wikipedia, Wikidata | Address n/a (resort area). |
| Golden Gate Bridge | CA | verified | 2026-11-01 | Wikipedia, Wikidata | — |
| Port of Los Angeles | CA | verified | 2026-11-01 | Wikipedia, Wikidata | Trading-partner data is for 2020. |
| Monterey Bay Aquarium | CA | **partial** | 2026-11-01 | Wikipedia, Wikidata | Street address not sourced (Cannery Row only). |
| Cabazon Dinosaurs | CA | **partial** | 2026-11-01 | Wikipedia, Wikidata | Street address not sourced. |
| Slab City | CA | verified | 2026-11-01 | Wikipedia, Wikidata | Address n/a (informal settlement). |
| South Coast Plaza | CA | verified | 2026-11-01 | Wikipedia (infobox address), Wikidata | Anchor stores and retailer count change over time. |

## Imported listings (Phase 4)

**818 basic listings** (FL 200, TX 205, AZ 141, CA 272) were imported on 2026-11-02 with `npm run import:wikidata` (`scripts/import/wikidata-listings.mjs`, settings in `scripts/import/config.mjs`). The project owner approved this two-tier approach on 2026-11-02. All listings are marked `partial` and labelled "Basic listing" on the site.

**What gets in.** Wikidata items of selected classes (museum, lighthouse, state park, hotel and others; see the config) located in one of the four states, with coordinates, an English Wikipedia article and a Commons photo, and with no closure or demolition date. Items are ranked by how many Wikipedia language editions cover them, leaving out wikis known for bot-made stubs (Cebuano, Swedish, Waray and others), and capped per type and state. Places that already have a full profile are excluded.

**What is shown, and from where.**
- Name, coordinates, "inception" year, official website, street address (when present) and National Register of Historic Places listing all come from the item's **Wikidata** entry, which is linked as a source on every listing.
- The **Wikipedia** article is linked as the second source. No text is taken from it.
- **City or county** comes from Wikidata's "located in" value. Where Wikidata only gives the state, the county is looked up from the coordinates through the U.S. government's FCC Census Area API.
- The **summary** is generated from a template ("A lighthouse in Pescadero, California, built in 1872.") and states nothing beyond those fields. The verb for the year depends on the type: established, founded, opened or built, and "dating from" where none fits.

**Known limits.** Wikidata can be out of date or wrong. Its "inception" may mean construction, founding or official designation depending on the item. A ranking by Wikipedia coverage is only a rough signal of how notable a place is. The coordinates of large areas mark a representative point, not an entrance.

**Excluded after review** (listed in `EXCLUDED` in the config):
- Texas Stadium: demolished in 2010, but Wikidata has no end date.
- Bridge Canyon Dam: proposed, never built.
- California State University: a university system, not a single campus.

**Photos.** Each listing's photo is the Wikidata "image" (P18). Author, license and size come from Commons metadata, and photos without a recognised license or a named author are dropped. **Every photo was checked by eye** on 2026-11-02, on contact sheets of all 789 thumbnails. 36 were rejected and replaced by the "Photo needed" placeholder, all listed with reasons in `src/data/imported/photo-review.ts`:
- close-ups of animals or plants (12)
- people as the main subject (5)
- logos or emblems (7)
- maps or plans (4)
- place not clearly visible (6)
- objects, such as a painting or a wine bottle (2)

Photos added by a future import show "Photo not yet reviewed" until they are checked.

## Collections

Ten collections were published in Phase 4. Each one combines full profiles and listings. Their intros are editorial and make no factual claims beyond what the listed places' own pages source.

## Skipped research targets

None. All 26 targets from the brief were published.

## Editorial (non-factual) content

`src/data/states.ts` intros and `src/data/categories.ts` descriptions are editorial text written for this project. They deliberately contain no statistics, dates or other checkable claims.
