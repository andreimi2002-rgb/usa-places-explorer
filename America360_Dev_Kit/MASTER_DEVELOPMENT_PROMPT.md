# AMERICA 360 — Master development brief & coding-agent prompt v1.0

**Project direction confirmed: 27 November 2026.** This supersedes the earlier reconstructed v0.1 plan. It is not a recovery of the lost temporary chat. The reference HTML files are design prototypes, not production code or a verified inventory.

## Instructions to the coding agent

Act as the senior product engineer, UX designer, database architect, GIS engineer and data pipeline engineer for America 360. Work in the existing VS Code workspace. Read this entire brief and the files under `references/` before making changes. Implement real, runnable code; do not stop at architecture advice, a mockup, a task list or pseudocode. Work in phases with explicit acceptance criteria. Use current official documentation and check compatible dependency versions before installing them. Do not silently overwrite unrelated projects, delete existing work, deploy, create paid services or incur API charges without authorization. Never commit secrets.

## 1. Product mission and scope

America 360 is a systematic, maximally comprehensive digital encyclopedia of the United States and American life. Not a travel guide, not a generic AI image generator, not a directory limited to tourist highlights. The ambition is to catalog every discoverable kind of entity, including ordinary places and institutions, and connect them through geography and subject matter. The user must be able to drill down from the country to a real individual entity, or browse by theme across geographic boundaries.

First priority: build the real website and the reusable knowledge infrastructure. Florida is the first state; Jacksonville is the deep pilot for the city and entity experience. Expand across all 67 Florida counties and all available incorporated municipalities, census-designated places and other documented communities. No nationwide rollout until the Florida pipeline and templates are proven. Full coverage is an ongoing, measurable objective, never a promise that every changing business is known. Future modules use the encyclopedia as their factual world; do not prioritize them over it.

The 50 states and DC should be representable; territories, tribal jurisdictions, regions and metro areas should be supported as appropriate geographic entities and not forced into a state/county/city hierarchy. Start in Florida. Do not pre-populate fake content for the rest of the country. Public-facing English proper names and US-specific terminology must be preserved; use a locale-ready UI, initially English or Romanian according to a configuration flag. Preserve US customary and metric units where useful. Design mobile-first for iPhone as well as desktop.

## 2. Core product features

- Geographic atlas: USA → state → county or equivalent → locality/community → neighborhood/area → real entity. Support overlapping boundaries and many-to-many relations (a city can intersect counties; a road crosses multiple jurisdictions). A brand, operator, agency, branch, building and venue are different entities.
- Thematic encyclopedia: domain → category → subcategory → entities, with combinations of geographic, type, status and text filters. Allow nested categories without a fixed depth limit and multiple classifications per entity.
- Universal search: names, aliases, descriptions, categories and geography, with autocomplete, filters, accessible results and entity links. Start with indexed full-text/trigram search where supported. Add semantic search later only when useful.
- Reusable state, county, locality, neighborhood, category and entity page templates. Stable URLs, breadcrumbs, responsive layouts, cross-links, shareable filters, proper metadata, loading/empty/error states, keyboard navigation and meaningful alt text.
- Maps: real coordinates and boundaries, clustered markers, layers, visible attribution, useful fallback when tiles or geodata are absent. Do not invent coordinates, boundaries or routes. Use a properly licensed tile provider; do not assume public tile servers allow arbitrary production traffic.
- Coverage dashboard: per area × category, counts of imported, reviewed, verified, stale, rejected and missing records. Only calculate a percentage with a documented, dated denominator and clearly defined universe. Never confuse seed data with complete coverage.
- Admin/editor workflow: browse import batches, inspect provenance, merge duplicates, review proposed edits, report errors, publish and revert changes; authentication and least privilege before exposing write actions.
- Sources and media: show evidence, last verification and source dates. Real photos must have appropriate usage rights and credit; AI visuals clearly labeled and separate from factual photos. No broken image placeholders masquerading as verified photographs.

## 3. Taxonomy baseline (expandable)

1 Geography/territory; 2 Cities and communities; 3 Government and administration; 4 Police, fire and emergency services; 5 Retail/shopping; 6 Brands/chains; 7 Food/dining; 8 Economy/industry; 9 Nature/ecosystems; 10 Fauna/flora; 11 Outdoor/recreation; 12 Sports; 13 Automotive; 14 Gas stations/truck stops; 15 Roads/infrastructure; 16 Transport/logistics; 17 Housing/lifestyle; 18 Education; 19 Healthcare; 20 History/heritage; 21 Culture/entertainment; 22 Hobbies; 23 Demographics/society; 24 Climate/environment.

Expand retail, for example, into malls, outlets, supermarkets, supercenters, convenience stores, gas station stores, hardware, outdoor, fishing, hunting, pet and exotic animal shops, electronics, collectibles, sneakers, thrift, specialty stores, automotive and other local businesses. Do not collapse specific branches into generic brand pages. Sports includes leagues, teams, venues, college and local sports. Wildlife includes taxonomy, habitat, documented distribution and conservation, without publishing sensitive species locations. Add categories as discovered rather than force every entity into an ill-fitting type. Avoid private residential addresses or sensitive personal information; public-facing institutions and businesses are in scope.

## 4. Proposed technical foundation

Prefer Next.js App Router + TypeScript, Tailwind CSS, PostgreSQL/Supabase with PostGIS, MapLibre GL JS, and a typed validation layer such as Zod. Use Python or TypeScript for repeatable data ingestion; select one primary ETL runtime and document why. GitHub for version control; Netlify or Vercel for deployment after local verification and explicit authorization. Validate current official docs and hosting compatibility, including server-side routing, environment variables, database pooling and geo extensions. Use server components where appropriate and client components for interactions. Do not expose server credentials in bundles. Choose simple modules rather than premature microservices; keep provider-specific integrations behind interfaces.

Suggested repository structure (adapt after audit):

```text
src/app/                 routes, layouts, API handlers
src/components/          design system, atlas, encyclopedia, search, map
src/lib/                 database, queries, auth, validation, provenance
src/features/            encyclopedia, atlas, coverage, assistant (later)
supabase/migrations/     versioned schema, indexes, policies
scripts/ingest/          source adapters, validation, upserts, reports
seed/                    small attributed fixtures
references/              supplied HTML prototypes, previous plan
docs/                    architecture, data dictionary, source registry, roadmap
tests/                   unit, integration, browser tests
.env.example             variable names only
README.md                local setup and commands
```

Support two explicit modes: local demo with a small attributed fixture set and real database mode using migrations and credentials. Do not pretend the fixture mode is connected to Supabase. If credentials or Docker are unavailable, finish the local mode and report exactly what remains to configure. No hidden mock data in production.

## 5. Data architecture

Implement migrations and typed interfaces for stable UUID entity identifiers and canonical slugs, categories (parent relationships), entity categories, geographic areas (official codes, geometry and aliases), entity geography (many-to-many with relation type), entity relations (typed and directional), sources, source records, entity facts/provenance, media (rights and attribution), import runs, review issues and audit history. Consider dedicated tables for entity types with important structured attributes, such as businesses, branches, institutions, venues, roads, protected areas and species, rather than a single giant unvalidated JSON blob. Extensible JSON attributes may be used if validated per type.

Each entity has a canonical name, aliases, type, status, short and long descriptions when known, optional coordinates, geographic links, related entities, source references, dates created/modified/verified, optional external IDs scoped by provider, and visibility. Store facts as source-linked values with valid/as-of date, units, confidence/review status where appropriate. Preserve raw source provenance subject to its license; distinguish source publication, retrieval and observation dates. Do not turn missing values into zeros, fake opening hours, invented counts or AI-generated facts. Store contradictory claims for review instead of overwriting silently. A source may establish existence but not every attribute. Enforce uniqueness for provider + external ID and stable canonical URLs; preserve redirects for merged entities. Use spatial and text indexes and query pagination. Use transactions, foreign keys, schema constraints, row-level security where appropriate and least-privilege database roles.

## 6. Page experience: what to build first

**Home:** visual entry into the atlas, Florida clearly marked as the active state, category catalog, search, editorial discoveries, truthful coverage status. No unrelated states with fabricated data.

**Florida page:** overview, geographic map, county directory with all 67 names from an authoritative source, localities and regional groupings, domain navigation, key dated statistics, sources, coverage by category and links into counties.

**County page:** county profile, official government link, county seat if sourced, municipalities/CDPs, map/boundary, local institutions and categories, counts reflecting actual dataset coverage.

**Jacksonville city page:** a complete reusable layout with hero, geographic breadcrumbs, city profile, dated demographic and geographical facts, neighborhoods, thematic category navigation, searchable/filterable local directory, maps, related geography and entities, source citations and coverage status. Include representative entries across as many categories as can be sourced, including the everyday places that distinguish this project from tourism. Keep it rich but not a single endless homepage; allow section tabs or subroutes, category pagination and drill-down. Use the Jacksonville reference demo as a starting visual reference, not a requirement to copy it pixel for pixel.

**Entity page:** clear name/type, real photo when rights permit, location and map, verified facts with dates, description, relevant type-specific sections, related entities, official links, sources and corrections link. For example, a shopping center has an operator and tenant directory; a species has taxonomy and range/habitat; an agency has jurisdiction and public services; a stadium has tenants and event-related metadata. A missing section must read as not yet documented, not a false absence.

Visual direction: premium editorial atlas and modern encyclopedia. Deep navy, muted gold accents, strong typography, understated cards, information-dense but legible data tables, restrained animation, consistent visual hierarchy. Implement design tokens and components, light/dark optional later. No fake live stats, ratings, coverage percentages or dead controls.

## 7. Florida data program

Create a source registry including URL, publisher, coverage, dataset version, license/terms, expected fields, external IDs, retrieval method, refresh interval, limitations and whether redisplay is permitted. Start with official sources and confirm the exact datasets and current access before implementing. Candidate sources: US Census TIGER/Line and Gazetteer files, Census population/demographic datasets, USGS GNIS, Florida state GIS/FGDL and county GIS portals, official local government directories, FDOT, Florida DEP, FWC, Florida State Parks, National Park Service, public agency and institutional directories. For business registration use Florida Sunbiz only as evidence for legal entities, not proof of storefront existence. For retail locations use official store locators/directories or properly licensed open data. OSM is a possible complementary source: evaluate ODbL attribution and database obligations, and avoid proprietary place APIs that prohibit persistent storage or redisplay of their content. Respect terms, rate limits and licenses; do not bypass restrictions or scrape indiscriminately.

ETL pattern: discover source → record license and metadata → acquire → normalize → validate → stage → resolve identity/deduplicate → link geography → review conflicts → publish → report counts/errors → refresh. Preserve reproducibility (source snapshot/checksum where permitted, schema version, run ID and timestamps). Imports must be idempotent and resumable; support dry run, batch processing, logs and rollback. Validate coordinates, official identifiers and geometry; quarantine unresolved or invalid records. Avoid fuzzy auto-merging solely on similar names. Do not mark business closures based only on absence from one snapshot.

Rollout order: (A) Florida + 67 counties and sourced boundary metadata; (B) municipalities and CDPs, with non-incorporated communities where a reliable registry exists; (C) Jacksonville deep pilot for category coverage and relationship models; (D) repeat domain by domain across all counties, beginning with high-quality public data such as parks, institutions and infrastructure, followed by commercial/local directories and deeper content; (E) periodic refresh, quality review and gaps dashboard. For each category document what 'coverage' means, source universe, known gaps, how to measure it and who/what can verify it. Use open data where appropriate; avoid assuming a single source enumerates every location. AI may suggest candidate entities or draft descriptions from sources, but may not fabricate or silently publish facts.

## 8. Future module: America AI (confirmed requirement, not Phase 1)

A site-integrated contextual assistant, available on any encyclopedia page, not merely an external chatbot. It automatically knows the active entity ID, geographic scope, page type, locale and filters. A user can ask about the current place, compare with others, discover related entries or ask any America-related question. Offer contextual suggested questions, persistent conversation during navigation, source links, related entity cards and explicit indications when the encyclopedia lacks evidence. User may switch between current page, region and all America scope. Provide a mobile drawer and desktop side panel that do not obstruct the reading experience.

Architecture: server-side chat API with provider abstraction; context derived from validated entity IDs and database records; retrieval using structured SQL/text search plus optional embeddings/pgvector later. Provide narrowly scoped read-only tools such as `get_entity`, `search_entities`, `get_related_entities`, `list_entities_by_geography`, `get_sources`, `get_coverage`. Validate inputs, bound result sizes, use parameterized queries, enforce visibility/auth rules and timeouts. Avoid unrestricted SQL, access to credentials, hidden admin records or arbitrary writes. Treat imported web content as untrusted data, not instructions. Build source-grounded prompts and structured citations from retrieved records, link to actual entity pages, and say when current info is unknown. Optional web lookup only via an explicitly configured provider with appropriate terms, marked as external and dated. No fake citations, no unsupported guarantee of completeness.

Later, add streaming, conversation storage (with privacy controls/retention), rate limits, per-user quotas, budget caps, abuse controls and a feedback system. API keys stay server-side; API usage requires separate credentials/billing, not the user's ChatGPT subscription. Provide a disabled or explicitly labeled demo state until configured. Do not connect a paid provider now. Evaluate on factual accuracy, attribution, missing-data behavior, prompt injection, page context changes and comparisons. Phase 1 may include an interface boundary and roadmap only; focus development effort on the actual encyclopedia.

## 9. Future experiences (design for them, do not implement before core)

- American Life Simulator: select a real city and create virtual day-to-day routines, errands, exploration tasks, shopping, commuting and hobbies. Use actual entities/branches, hours when sourced, geographic plausibility and explicit virtual vs real-world status. Maintain daily objectives, choices, progression and history; no implication user physically visited a place. Generate only feasible scenarios based on available data; no invented real locations.
- Random Explorer: random real entities within selected geography/categories; no fake places.
- Road Trip Simulator: real routes, localities, stops and landscape transitions using licensed routing/map data.
- Discovery Passport: saved entities, collections, virtual discoveries, achievements and progress without misrepresenting coverage.
- AI Visual Experiences: generate labeled visual interpretations based on real entity/location context; keep separate from documented photography.
- Optional comparison, timelines and other modules after core coverage. All reuse central IDs and relationships, never duplicate the encyclopedia.

## 10. Phased implementation and gates

**Phase 0 — Audit:** inspect workspace, git status, existing code and supplied references. Identify dependencies, constraints, commands, reusable assets and potential data risks. Create/update README, `docs/ROADMAP.md`, `docs/DECISIONS.md` and `docs/DATA_SOURCES.md`. Preserve unrelated work. If starting from an empty repo, scaffold safely. Do not ask the user to repeat known product decisions.

**Phase 1 — Working local website foundation:** scaffold, responsive design system, reusable routing/pages, small real sourced fixture set, category catalog, search/filter, breadcrumbs, entity relationships, navigation, source panel, honest coverage view and missing-data states. Include Florida, Duval County, Jacksonville, representative real entities. Support Florida county index if verified source is available; if not, label partial data and report blocker. Build production-ready templates, not only a visual demo. Implement database schema/migrations and mode switch; no requirement to provision a remote service without credentials. Verify local startup and production build. Deliver working code and exact commands.

**Phase 2 — Database and geographic import:** run migrations against local/configured database; implement registry, staging, validation, reproducible imports for verified county and locality sources; spatial relationships and maps; basic editor review. Confirm all 67 counties present with official IDs, valid geometries where available and no duplicates. Document definitions of locality types and gaps. Verify rerunning imports does not duplicate records. Ensure data persists and UI reads database in real mode.

**Phase 3 — Jacksonville deep coverage:** add type schemas and source adapters/curation for multiple domains; public directory pages, real entity details, evidence, coverage and relation integrity. Choose completion gates by source universe, not arbitrary counts. Validate with user before rolling patterns statewide.

**Phase 4 — Florida systematic rollout:** prioritized per-domain imports and county-by-county enrichment; automated validation, deduplication, refresh and human review. Coverage matrix, source limits and change reports. Complete all attainable geographic/category targets; document unknowns. Deploy only after requested and tested.

**Phase 5 — America AI and personal exploration:** integrate contextual read-only assistant; add Random Explorer/Passport as appropriate; then Life Simulator, Road Trip and visual experiences. Evaluate cost, trust and data quality. Expand beyond Florida after approval and demonstrated repeatability.

## 11. Acceptance criteria for the first coding session

- Local application runs with documented commands (including fixture mode without secrets) and routes render at mobile and desktop widths.
- Home → Florida → Duval → Jacksonville → category/entity navigation works with stable URLs and back/forward navigation.
- Representative source-linked entity pages show only sourced facts; search, category filter, geographic scope and related entities actually function.
- 24-domain taxonomy is extensible; missing domains show honest empty states, not invented content. Coverage is derived from actual records and has explicit scope.
- Schema and seed/import strategy are version controlled, typed and documented; `.env.example` contains placeholders only.
- `lint`, typecheck, unit tests and production build pass; add browser smoke tests for navigation, search, filtering, entity detail and mobile. If a browser cannot run, explicitly report that and which tests actually ran. Do not claim unrun tests pass.
- No unintended deletion, paid API calls or external deployment. No credentials in repository. Include file changes, commands run, actual outcomes, limitations and next milestone in final report.

## 12. Execute now

Begin with Phase 0 and implement Phase 1 in the current workspace, not all phases at once. Use the supplied demos as visual/content references. If the task is too large for one coding session, make the smallest coherent runnable vertical slice first, record unfinished acceptance criteria in the roadmap and continue from that checkpoint; do not claim all of Florida is completed. Prioritize robust reusable templates and the database model over decorative animation or future AI/simulator modules. Show a short plan before edits, then implement, run real checks, and provide concise handoff with exact startup instructions, what works and what remains. Keep a living progress log in `docs/PROGRESS.md` so future coding sessions can resume without losing context.
