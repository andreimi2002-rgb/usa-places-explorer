-- Phase 2 geography: unincorporated communities (USGS GNIS), county seats,
-- area-share intersections and relation-based coverage universes.
set search_path = a360, public;

-- New area type for named populated places that are neither incorporated nor CDPs.
alter type area_type add value if not exists 'community';

-- County seat links (county -> place) and area-share metadata on intersections.
alter table area_relations drop constraint if exists area_relations_relation_type_check;
alter table area_relations add constraint area_relations_relation_type_check
  check (relation_type in ('intersects', 'contains_internal_point_of', 'adjacent_to', 'consolidated_with', 'county_seat'));
alter table area_relations add column if not exists share numeric(7,6) check (share is null or (share >= 0 and share <= 1));

-- Coverage universes can count areas (default) or areas having a given relation.
alter table coverage_universes add column if not exists metric text not null default 'area_count'
  check (metric in ('area_count', 'relation_count'));
alter table coverage_universes add column if not exists relation_type text;
