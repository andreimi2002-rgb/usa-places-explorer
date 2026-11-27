# Progress log

Living log. To resume: read `America360_Dev_Kit/MASTER_DEVELOPMENT_PROMPT.md`, this file and `docs/ROADMAP.md`, then run the checks in the README to confirm the current state.

## Session 1 — 2026-11-27: Phase 0 + Phase 1

### Environment
Windows 11, Docker 29.9.3 running, Node 26.13.1, npm 11.20, Git 2.56. Python is not installed and not needed. PostGIS container: `postgis/postgis:17-3.5` on `127.0.0.1:5433`. The volume is `america360_a360_pgdata`.

### Done
- **Audit.** The workspace contained only `America360_Dev_Kit/`, which is left untouched. Its references were copied to `references/`. `git init` was run; nothing is committed yet.
- **Scaffold.** Next.js 16.4.6, React 19.3, TS 5.9, Tailwind 4.3, Zod 4.6, pg 8.23, Vitest 5, Playwright 1.65, ESLint 9 (`eslint-config-next`).
- **Schema.** Migrations 0001–0004 cover the core tables, PostGIS geometry and points, trigram and full-text indexes, roles `a360_read`/`a360_reader`/`a360_write`, RLS, security-invoker views, an audit trigger and aggregate review views.
- **Census ingest** (`npm run ingest:census`) loads 50 states + DC + PR, all **67 FL counties** (with 1:20m geometry), **411 municipalities** linked to counties (415 county-part relations), and **547 CDPs**, each linked to a county by its internal point (1:500k polygons). That is 3,216 dated, source-linked facts with checksums for all 8 files.
- **Curated pilot.** 55 entries (Jacksonville plus FL state agencies) and 9 informal neighborhoods, all placed in the 24-domain taxonomy (135 categories).
- **Evidence checker** (`npm run ingest:links`): 53 sources checked → 35 ok, 12 blocked, 5 network errors, 1 not found. Results: 29 entries verified, 8 imported, 17 unreviewed and 1 stale (JFRD: the city's own link is 404). There are 4 verified entity facts, 8 verified relations, and 24 open review issues.
- **Seed** (`npm run db:seed`) runs in one transaction with an import_run record. A second run changes 0 rows (tested).
- **Website.** Routes: home, place (country/state/county/municipality/CDP/neighborhood), directory with topic/status/text filters and pagination, localities, entity, topics, search plus `/api/search` autocomplete, coverage, sources, 404 and error pages. Maps are SVG from Census boundaries. The UI is in en/ro. One CC BY-SA photo is credited.
- **America AI.** Typed interface boundary only, disabled.

### Test results (actually run, 2026-11-27)
| Check | Result |
|---|---|
| `npm run lint` | pass (0 problems) |
| `npm run typecheck` | pass |
| `npm test` (unit) | 38/38 passed |
| `npm run test:integration` (real PostGIS, separate DB) | 33/33 passed: migrations idempotent, seed idempotent, 67 valid geometries, spatial query, RLS/read-only role, redirects, fixture↔database parity |
| `npm run build` | pass |
| `npm run test:e2e`, fixture mode (Chromium desktop + iPhone 13 viewport) | 14/14 passed |
| `npm run test:e2e`, database mode | 14/14 passed |

### Bugs found and fixed during the session
- CSV fields containing commas ("Islamorada, Village of Islands") produced NaN. Zod caught it; a quote-aware parser fixed it.
- Duplicate CDP names (two "Midway" CDPs) now get county-qualified slugs.
- The download cache manifest had a race between parallel downloads; acquisition is now sequential.
- The Florida page showed 57 of 67 counties: children were fetched as 614 mixed rows with a 500 cap. It now queries counties only.
- Unknown pages returned HTTP 200 because of streaming (root `loading.tsx` and streamed metadata). The fix is `htmlLimitedBots: /.*/`, with the loading UI kept only on `/search`.
- Wikimedia no longer serves 2560px thumbnails (HTTP 400); the media record now uses 1920px.
- Outdated prototype URLs (JFRD, MiLB) were corrected or flagged.

### Known limitations / blockers
- County seats and official county websites: the FL Dept. of State directory returns HTTP 403 to automated access. Shown as "Not yet documented" with the reason.
- The Census API now requires a key, so bulk files were used instead. There is no U.S. total population row in co-est2025.
- CDP → county is internal-point based (labeled as derived). Full intersections are Phase 2.
- Neighborhood placements from the v0.1 prototype are shown as "pending review", never as facts.
- Only machine verification exists; the `reviewed` (human) status and the editor UI are Phase 2.
- Entity coordinates: none are sourced yet, so no entity map pins are drawn (by design).
- The FWC, FDOT, Academy, CSX, JPL and Big Talbot (state parks) sites block automated checks. Their claims await manual review.
- The "Cities & communities" domain shows 0 *entries* for Jacksonville because neighborhoods and municipalities are modeled as areas, not entities. They appear in the place pages instead.

### GitHub and Netlify (2026-11-27, same session)
- Code is on GitHub at `andreimi2002-rgb/usa-places-explorer`, branch `main`, as the owner chose. The previous `main` (American Sports Encyclopedia, Astro) is preserved on `archive/american-sports-encyclopedia-2026-11-27`, and git history is intact (fast-forward, no force push).
- Netlify project `american-sports-encyclopedia` auto-builds from that repo's `main`, so it now builds America 360. The first build had no server function (HTTP 404) because the project was created for a static Astro site. Fix: `@netlify/plugin-nextjs` is declared in `netlify.toml` and devDependencies, and `seed/**/*.json` is traced into server functions (`outputFileTracingIncludes`).
- Netlify project `americaexplorer` (the requested target) is linked to a different repo (branch `team-drip-v2`) and was **not** updated. The CLI deploy command was blocked by this session's permission policy. To point it at America 360: Netlify UI → americaexplorer → Project configuration → Build & deploy → Link repository → `usa-places-explorer`, branch `main`.
- Production uses `DATA_MODE=fixture` (no hosted database yet). Hosted PostgreSQL (e.g. Supabase free tier) plus `DATA_MODE=database` is a later step.

## Session 2 — 2026-11-27: Phase 2, step 1 (complete Florida geography)

Branch `phase-2-geography`, published via pull request and deploy preview only (Netlify credits: production deploys only on request).

### Done
- **New adapter `npm run ingest:geography`** (`scripts/ingest/florida-geography.ts`). Needs the local PostGIS for the spatial work only; its output is committed JSON, so the website needs no PostGIS.
  - **Exact place/county intersections:** Census 2025 boundaries (958 places, all counties) intersected with `ST_Intersection`, storing area shares. 13 places span several counties. All 547 CDPs moved under the county with their largest share, and the bundle-1 internal-point approximations were removed.
  - **County seats + websites:** taken from Wikidata (CC0), because FL DOS refuses automated access. 66/67 seats are linked to Census places (Collier's seat, "East Naples", is not a current Census place, so it is kept as an unreviewed fact). There are 62 websites.
  - **USGS GNIS named populated places:** 7,076 records. 791 are the same as Census places and were dropped. 6 were merged into curated Jacksonville neighborhoods, which received official points. That leaves **6,279 new `community` areas**: 4,299 unincorporated and 1,980 inside municipalities, 162 of them inside Jacksonville.
- **Place boundary polygons** (simplified) are shown on county, city and CDP maps and loaded into PostGIS `areas.geom` (958 valid geometries).
- **County website link checks:** 62 checked → 26 confirmed (the county name was found on the page), 15 blocked (HTTP 403), 16 network errors, 5 redirects to a new domain. Many FL government servers do not answer from outside the U.S. (curl also times out), so these are left "unreviewed" and should be re-checked from a U.S. network.
- **Schema:** migrations 0005–0006 add the `community` area type, the `county_seat` relation, `area_relations.share`, relation-based coverage universes and `area_rank`.
- **UI:** county seat and website on county pages, "County seat of …" on city pages, area shares under "Related geography", a named-places section, new locality types (community, and a city-level locality list).
- **Search:** GNIS points rank below real jurisdictions with the same name (`areaBoost`, identical in fixture and SQL).
- **Performance:** the coverage query was rewritten with a lateral join (>8 s → 0.4 s), and the seed now runs `ANALYZE` after bulk loads.

### Test results (actually run)
| Check | Result |
|---|---|
| lint, typecheck, build | pass |
| unit | 49/49 (11 new geography tests) |
| integration, real PostGIS | 38/38 (parity now covers a county with its seat, a neighborhood with a GNIS point, a GNIS community, area shares and more searches) |
| E2E fixture mode | 16/16 |
| E2E database mode | 16/16 |

### Next milestone
Phase 2, step 2: hosted Postgres (Supabase free tier) plus the editor/review queue with authentication. Re-run `ingest:links` from a U.S. network to resolve the geo-blocked government sites.

## Session 3 — 2026-11-27: Enrichment pilot (Jacksonville "big places" + brand presence)

Branch `phase-2b-enrichment`, built on `phase-2-geography` (PR #14), with a deploy preview only.

### Decisions (with the owner)
- "Big places" means anything with a Wikidata item and an English Wikipedia article. Brands are entities, and individual branches come later from OSM. In this pilot a brand appears in a city only if OpenStreetMap maps at least one location of it there. Order of work: rich Jacksonville → Florida "big places" → other states → everyday places.
- Wikimedia requires an identifying, contactable User-Agent. With the owner's approval it now includes the public GitHub repo URL (no email).

### Done
- **`npm run ingest:enrich -- --area=<slug>`** (`scripts/ingest/enrich-area.ts`, generic for any area with a boundary polygon):
  - Wikidata items inside the boundary that have an English Wikipedia article, plus organizations headquartered in the area. 424 places for Jacksonville; 32 curated entries enriched instead of duplicated.
  - Classification by Wikidata class labels (`scripts/ingest/type-map.ts`). Unmapped classes are reported (52, mostly events, as intended).
  - Wikipedia lead text (CC BY-SA, shown verbatim with attribution). Commons photo or logo only with a CC0/PD/CC BY/CC BY-SA license read from the file metadata: 670 images.
  - OpenStreetMap brand presence: 1,759 branded locations, **550 brands** with mapped counts (McDonald's 44, Publix 29, Starbucks 23…).
  - A disk cache for every response: re-runs make 0 live requests. Pacing (2.5 s) and Retry-After handling. Batched Wikipedia extracts (20 per call): **114 requests in total** for the whole city.
- **Migration 0007:** `entities.wikidata_id` and Wikipedia columns, `facts.scope_area_id` (per-area brand counts), and an `entity_summaries` image column.
- **Rich entity page:** hero photo with credit, Wikipedia "About" with license, an encyclopedic infobox (✓ marks values verified on the official site), a map with the sourced point inside the city boundary, Connections, **Nearby** (real distances; PostGIS `ST_DWithin` and haversine give the same order), brand "Locations", a completeness checklist, and pending-review and sources/verification sections collapsed at the bottom.
- **City page:** "Brands & chains present" grouped by type (top 12 per group plus a link), and a diversified "featured" showcase (photo first, then type importance, one per category). The directory and topic pages use the featured order.
- **Search:** exact alias matches now rank like exact names ("jaguars" → Jacksonville Jaguars). Names and aliases are stored `/`-separated in `name_norm`.
- **Bugs found and fixed this session:**
  - Postgres `getEntity` assigned the parallel query results to the wrong variables (media ↔ issues). Caught by the parity tests.
  - Correlated `area_descendants()` per row timed out at state scale. Replaced by a materialized scope CTE (>8 s → ~100 ms).
  - The `pg` search_path query raced the first statement; it is now a connection option.
  - Two Wikidata items could enrich the same curated entry; matching is now one-to-one.
  - Business schools were classified as K-12.
  - Wikimedia 429s from an unidentified client were solved with the contact User-Agent, the cache and batching.

### Test results (actually run)
| Check | Result |
|---|---|
| lint, typecheck, build | pass |
| unit | 56/56 |
| integration, real PostGIS | 48/48 (parity: enrichment details, nearby, brand presence, featured ordering) |
| E2E fixture mode | 18/18 |
| E2E database mode | 18/18 |

### Known limitations
- Brand counts are OSM-mapped locations, not official totals. Branch entities (address, hours) come in the "small places" phase.
- Wikidata values are shown as imported (secondary source). Only curated claims confirmed on official sites get ✓.
- 127 of the 424 places have no coordinates (organizations, teams, media), so they have no map or nearby section.
- The UI strings added this session are English only (the ro dictionary does not cover them yet).

### Next milestone
Run `ingest:enrich` for every Florida county (big places only), then move to hosted Postgres (fixture JSON grows with each area).

### Next milestone (from session 1)
Phase 2, step 1: TIGER/Line polygons in PostGIS → real CDP/municipality intersections, plus a manually curated county seat/website table with citations. Then the review-queue editor with authentication.
