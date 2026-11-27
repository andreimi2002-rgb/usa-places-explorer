# Source registry

The machine-readable registry lives in the `sources` table. It is built from `seed/generated/census-florida.json` (datasets), `seed/curated/sources.json` (directories and references) and one `official_website` source per curated entity. The `/sources` page shows license, retrieval date, checksum, last check and how many records cite each source.

## Active datasets (U.S. Census Bureau, public domain)

| id | Dataset | Fields used | Refresh | Limitations |
|---|---|---|---|---|
| `census-gazetteer-2026-states` | 2026 Gazetteer, states | GEOID, USPS, ANSI, land/water area, internal point | Annual | Not legal boundaries |
| `census-gazetteer-2026-counties` | 2026 Gazetteer, counties | GEOID, ANSI, areas, internal point | Annual | No county seats or websites |
| `census-gazetteer-2026-places` | 2026 Gazetteer, places | GEOID, LSAD, FUNCSTAT (A = incorporated, S = CDP), areas, internal point | Annual | No county field |
| `census-popest-v2025-counties` | Vintage 2025 county totals (co-est2025-alldata) | ESTIMATESBASE2020, POPESTIMATE2025 | Annual; each vintage revises | Estimates, not census counts. No U.S. total row |
| `census-popest-v2025-subcounty-fl` | Vintage 2025 subcounty totals, Florida (sub-est2025_12) | SUMLEV 162 (places), 157 (place parts per county) | Annual | Incorporated places only |
| `census-cb-2024-boundaries` | 2024 cartographic boundary files 1:20m (display) and 1:500k (CDP → county) | geometry, GEOID | Annual | Generalized; not for legal use |

Retrieval is an HTTPS bulk download (`npm run ingest:census`), done sequentially with a descriptive user agent. SHA-256 checksums and retrieval times are recorded per file.

Note: `ESTIMATESBASE2020` (Jacksonville: 949,607) is the April 1, 2020 estimates base. It is **not** the published 2020 Census count (949,611 in the v0.1 prototype). The site labels it accordingly.

## Phase 2 geography sources (`npm run ingest:geography`)

| id | Source | License | Use |
|---|---|---|---|
| `census-cb-2025-places-counties` | Census 2025 cartographic boundaries, FL places + U.S. counties (1:500k) | Public domain | Exact place/county area shares (PostGIS), place polygons for maps |
| `usgs-gnis-domestic-names-fl` | USGS GNIS Domestic Names, Florida | Public domain | 6,279 named populated places (communities, named places within cities). Lakes, streams and islands in the same file are reserved for the nature domain |
| `wikidata-fl-county-seats` | Wikidata SPARQL (P36 county seat, P590 GNIS id, P856 website) | CC0 | County seats (66/67 linked) and county websites (62). A secondary source, used because FL DOS returns 403 |
| `site-<county>-county-fl` | Each county's official website | Cited only | Link-checked. Many Florida government servers do not answer non-U.S. traffic, so re-check from a U.S. network |

## Enrichment sources (`npm run ingest:enrich -- --area=<slug>`)

| id | Source | License | What is used | How it is shown |
|---|---|---|---|---|
| `wikidata` | Wikidata (API + SPARQL) | CC0 | Notable places (items with coordinates in the area boundary **and** an English Wikipedia article), organizations headquartered in the area, structured statements (opened, inception, operator, owner, capacity, area, address, league, HQ, founder, heritage designation, identifiers), coordinates | Infobox values, status `imported`; ✓ only when also confirmed on the official site |
| `wikipedia-en` | English Wikipedia REST `page/summary` | CC BY-SA 4.0 | Lead summary | Shown verbatim under "About" with article link, license and retrieval date. Never turned into facts |
| `wikimedia-commons` | Commons `imageinfo` + `extmetadata` | Per file | Photo (P18) or logo (P154), **only** if the file's license is CC0, public domain, CC BY or CC BY-SA | Hero/thumbnail with author, license and file-page link |
| `openstreetmap-overpass` | OpenStreetMap via Overpass (one bbox query, filtered to the boundary) | ODbL 1.0 | Number of mapped locations per `brand:wikidata` inside the area | "Brands & chains present" and brand "Locations"; labeled as mapped counts, not official totals |

Classification uses the English labels of Wikidata classes (`scripts/ingest/type-map.ts`), so the rules stay readable; unmapped classes are reported by the script so the map can grow.

## Directories and references (cited, not redisplayed)

| id | Publisher | Use | Status on 2026-11-27 |
|---|---|---|---|
| `visit-jacksonville-neighborhoods` | Visit Jacksonville | Names of informal neighborhoods | ok |
| `visit-jacksonville-downtown` | Visit Jacksonville | Evidence for St. Johns River, Riverwalk | ok |
| `coj-parks-directory` | City of Jacksonville | Candidate for a full parks import | ok |
| `fwc-wildlife-profiles` | Florida FWC | Species profiles | blocked (HTTP 403) |
| `fdot-home` | FDOT | Highways reference | blocked (HTTP 403) |
| `wikimedia-commons` | Wikimedia | Licensed photographs (per-file license in `media`) | ok |

## Official websites (one per curated entity)

53 automated checks were run on 2026-11-27: 35 ok, 12 blocked (HTTP 403 or robots.txt), 5 network errors, 1 not found. The not-found page is JFRD: the City of Jacksonville's own link returns 404. Blocked sources are never bypassed. Their claims stay unreviewed until a person reviews them.

## Candidate sources (not yet integrated)

- **Florida Dept. of State county and city directory** (dos.fl.gov) has county seats and official websites. It returned HTTP 403 to automated requests, which blocks the county-seat and website fields. Next step: manual curation with citation, or an alternative official source.
- **Census place-county relationship and TIGER/Line place polygons**: needed for full CDP and municipality spatial intersections (Phase 2).
- **USGS GNIS / Geographic Names**: unincorporated communities.
- **FDOT open data, FL DEP state parks GIS, FWC open data, NPS API** (requires a free key; not used): domain imports.
- **OpenStreetMap**: possible complement. ODbL attribution and share-alike obligations must be evaluated first.
- **Florida Sunbiz**: evidence of legal entities only, never proof that a storefront exists.
- Proprietary place APIs that forbid storage or redisplay will not be used.
