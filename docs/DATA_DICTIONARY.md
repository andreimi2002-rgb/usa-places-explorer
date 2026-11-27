# Data dictionary (schema a360)

Defined in `supabase/migrations/0001`–`0004`. TypeScript row types are in `src/lib/data/dataset.ts`, and input validation is in `src/lib/domain/schemas.ts`.

| Table | Purpose | Key constraints |
|---|---|---|
| `sources` | Registry of datasets, directories, references and official websites | id is a slug; checksum is hex-64; `redisplay_permitted` is required |
| `import_runs` | One row per ingest or seed run: adapter, schema version, input checksum, counts, status | status ∈ running/succeeded/failed/rolled_back |
| `source_records` | Retrieval evidence (link checks): HTTP status, final URL, title, body checksum. Page content is not stored | FK to source |
| `areas` | Geographic entities: country, states, counties, municipalities, CDPs, neighborhoods, regions… | unique slug; unique (area_type, geoid); `internal_point` geography; `geom` MultiPolygon 4326 |
| `area_aliases` | Alternative names | |
| `area_relations` | Overlaps not expressed by `parent_id` (`intersects`, `contains_internal_point_of`, …) with method and source | unique (area, related, type) |
| `categories` | Taxonomy tree: 24 domains plus subcategories of any depth | unique slug; `parent_id` self-FK |
| `entities` | Encyclopedia entries: canonical name, type, status, description, official URL, optional sourced point, visibility, review status | unique slug; sensitive ⇒ no point; JSONB `attributes` validated per type in the app |
| `entity_aliases` | | |
| `entity_categories` | Many-to-many with one primary category | partial unique index on primary |
| `entity_areas` | Many-to-many geography with relation type and its own review status and evidence | relation ∈ located_in/headquartered_in/serves/operates_in/crosses/documented_in |
| `entity_relations` | Typed, directional entity-to-entity links (home_venue, operated_by, brand_of, part_of…) with evidence | no self links |
| `entity_external_ids` | Provider-scoped IDs | PK (provider, external_id) |
| `slug_redirects` | Old slug → target id for merges and renames | |
| `facts` | Source-linked values: key, text or number, unit, as-of date or label, source and reference, review status | exactly one subject; exactly one value type |
| `media` | Photos and visuals with credit, license and license URL; `ai_generated` flag | AI media can never have kind 'photo' |
| `review_issues` | Review queue: unverified claims, blocked or unreachable sources | private; aggregates only through views |
| `coverage_universes` | Dated, sourced denominators that make a percentage legitimate | denominator > 0 |
| `audit_log` | Row history for entities, facts and entity_relations (trigger) | |

Views and functions: `area_descendants()`, `area_ancestors()`, `category_descendants()`, `area_rank()`, `category_paths`, `area_populations`, `entity_summaries`, `review_issue_counts`, `entity_open_issue_counts`. Views use `security_invoker` so the caller's RLS applies, except the two aggregate-count views.

## Review status vocabulary

| Status | Meaning |
|---|---|
| `imported` | Loaded from a registered source; for entities, the source was reachable but no specific claim was confirmed |
| `unreviewed` | Curated or prototype placement, or the source blocked checks; needs a person |
| `reviewed` | A person reviewed it against the source (Phase 2 editor) |
| `verified` | Evidence text found in the cited source on a recorded date |
| `stale` | The source page no longer exists |
| `rejected` | Never shown |

## Area types

`municipality` means a Census place with FUNCSTAT A (an incorporated city, town or village); `type_label` keeps city, town or village. `cdp` means FUNCSTAT S (a statistical area, not a government). `neighborhood` means an informal named area with no official boundary.
