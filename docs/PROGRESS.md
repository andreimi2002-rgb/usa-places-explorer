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

### Next milestone
Phase 2, step 1: TIGER/Line polygons in PostGIS → real CDP/municipality intersections, plus a manually curated county seat/website table with citations. Then the review-queue editor with authentication.
