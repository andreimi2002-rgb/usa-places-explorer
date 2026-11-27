-- Indexes for state-scale data (thousands of entities, tens of thousands of media/facts rows).
-- Without media_entity_idx, entity_summaries scanned all media once per entity (O(n²), ~5 s).
set search_path = a360, public;

create index if not exists media_entity_idx on media (entity_id) where entity_id is not null;
create index if not exists media_area_idx on media (area_id) where area_id is not null;
create index if not exists entity_external_ids_entity_idx on entity_external_ids (entity_id);
create index if not exists review_issues_entity_idx on review_issues (entity_id) where entity_id is not null;
create index if not exists entity_relations_from_idx on entity_relations (from_entity_id);
create index if not exists entity_areas_entity_idx on entity_areas (entity_id, review_status);

analyze media;
analyze entity_external_ids;
analyze review_issues;
analyze entity_relations;
analyze entity_areas;
