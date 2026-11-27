# Architecture decisions

Each entry records the decision, why it was made, and when it should be revisited.

## D1 — Next.js App Router + TypeScript, single app (2026-11-27)
Server components render all encyclopedia pages. The only client components are the search autocomplete and the error boundary. There are no microservices. Every data page is `force-dynamic`, so one build serves both data modes.

## D2 — TypeScript is the only ETL runtime (2026-11-27)
The brief allowed Python or TypeScript. TypeScript won because the same Zod schemas validate ingest output, seed files and UI view models, and because the `normalize()` used for search is shared byte-for-byte between fixture and database mode. Python was not installed and is not needed. Revisit if heavy GIS processing (GDAL) becomes necessary; PostGIS covers it for now.

## D3 — Two explicit data modes behind one `DataProvider` interface (2026-11-27)
`DATA_MODE=fixture` serves the committed seed snapshot from memory. `DATA_MODE=database` reads PostgreSQL as `a360_reader`. A misconfigured database mode fails loudly instead of falling back. Both providers are built from the same normalized `Dataset` (`src/lib/data/build.ts`), and integration tests assert parity between them (stats, areas, entities, listings, search, tree, coverage, sources).

## D4 — Plain versioned SQL migrations, not an ORM (2026-11-27)
`supabase/migrations/*.sql` is applied by `scripts/db/migrate.ts`. Each migration runs in its own transaction and is checksummed. Editing an applied migration is refused. The files are Supabase-compatible apart from schema placement of extensions. Revisit only if a Supabase project is provisioned.

## D5 — Evidence-gated facts (2026-11-27)
Curated claims, entity-to-place links and entity relations each carry an evidence string. `ingest:links` fetches the cited page once (robots.txt respected) and records whether the evidence text appears in it. Only matched items become `verified` facts or relations. Unmatched items go to `review_issues` and are shown under "Proposed, pending review", never as facts. This check is weak evidence: the text appears on the cited page. It is labeled as a machine check with a date, and a human review status (`reviewed`) is reserved for Phase 2.

## D6 — Maps: server-rendered SVG from Census boundaries, no tile server (2026-11-27)
The brief warns against assuming public tile servers. The Phase 1 maps are SVG paths drawn from the Census 2024 cartographic boundary files (public domain), with internal points from the Gazetteer. This avoids licensing problems and works offline. MapLibre GL with a properly licensed tile provider is planned for Phase 2 or 3, once a provider is chosen. No coordinates are drawn unless they come from a source.

## D7 — Geography hierarchy plus overlap relations (2026-11-27)
`areas.parent_id` is the primary breadcrumb parent. Overlaps are stored in `area_relations`. For a municipality spanning several counties, the parent is the county part with the largest population and all parts are kept as `intersects` relations (Census SUMLEV 157). CDPs hang under the state and are linked to a county by the internal-point-in-polygon test (`contains_internal_point_of`, labeled as derived). Full spatial intersection is Phase 2.

## D8 — Deterministic UUID v5 identifiers (2026-11-27)
IDs are derived from kind and slug, so fixture and database IDs match and repeated seeds are idempotent. Merged or renamed slugs go through `slug_redirects`.

## D9 — Least privilege and RLS (2026-11-27)
`a360_read` is the read-only group, `a360_reader` the website login and `a360_write` is reserved for the editor API. RLS hides rows that are not public or are rejected. `review_issues` is private, and the website sees only aggregate counts through views.

## D10 — America AI: interface only (2026-11-27)
`src/features/assistant/contract.ts` defines the page context, read-only tools and the citation shape. `assistantStatus.enabled = false`. There is no UI button, so there is no dead control. No paid API calls.

## D11 — TypeScript 5.9 rather than 7.0 (2026-11-27)
TS 7 (native) is current, but Next 16's type-check integration and typescript-eslint still target the 5.x API. Revisit when both declare support.
