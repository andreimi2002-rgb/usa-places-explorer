# Roadmap

The phases follow the master brief, §10. Status as of 2026-11-27.

## Phase 0 — Audit ✅
The workspace held only the dev kit; no code, no git. Tooling checked: Docker 29.9, Node 26, npm 11, Git 2.56; Python is absent and not needed. The project was scaffolded alongside the kit without modifying it. Docs created.

## Phase 1 — Working local foundation ✅ (with listed gaps)
Done: scaffold, design system, reusable routes (home, place in 6 type variants, directory, localities, entity, topics, search, coverage, sources), dual data mode, migrations with RLS and roles, Census registry (all 67 counties, 411 municipalities, 547 CDPs, 50 states + DC + PR), 55 curated Jacksonville/Florida entries with evidence checking, 24-domain taxonomy, unit, integration and E2E tests.

Open Phase 1 acceptance gaps:
- [ ] County seats and official county websites. Blocked: the FL Dept. of State directory returns HTTP 403 to automated access. Needs manual curation.
- [ ] Human-reviewed status (`reviewed`) workflow. Only machine verification exists.
- [ ] Rights-cleared photographs beyond the single Jacksonville skyline image.

## Phase 2, step 1 — Complete Florida geography ✅ (2026-11-27)
Exact intersections, CDPs under their real counties, 66/67 county seats, 62 county websites, 6,279 GNIS named places and place boundary maps. See PROGRESS, session 2.

## Phase 2 — Database and geographic import (remaining)
- Import TIGER/Line place and county polygons into PostGIS. Compute real CDP and municipality intersections with `ST_Intersects` and area thresholds, replacing the internal-point derivation.
- Add the GNIS/Geographic Names adapter for unincorporated communities. Document a definition for each locality type.
- Use import_runs for every adapter. Add a staging table, quarantine for invalid records, and dry-run diffs.
- Basic editor: authentication, review queue UI over `review_issues`, merge with slug redirect, accept or reject claims, audit trail. Writes go through the `a360_write` role.
- MapLibre GL with a licensed tile provider, keeping the SVG fallback.
- Gate: rerunning every import creates no duplicates (already tested for the seed).

## Phase 3 — Jacksonville deep coverage
- City parks (COJ directory/GIS), libraries, fire stations, schools (FL DOE), hospitals (AHCA), and parks/preserves (FL DEP, NPS).
- For retail branches, use official store locators only where the terms allow. Brands stay separate from branches.
- Use per-type attribute schemas (venue capacity, team league, species taxonomy).
- Coverage universes per category, for example "COJ parks listed in the COJ GIS layer as of date X".

## Phase 4 — Florida systematic rollout
Domain by domain across the 67 counties. Automated validation, deduplication and refresh; change reports.

## Phase 5 — America AI and personal exploration
The contract is in `src/features/assistant/contract.ts`. Server-side provider abstraction, read-only tools, citations, budget caps and evaluations. Then Random Explorer, Passport, Life Simulator, Road Trip and labeled AI visuals. Nothing here starts before the core encyclopedia passes its gates, and nothing uses a paid API without explicit authorization.
