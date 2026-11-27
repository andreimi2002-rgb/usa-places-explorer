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
