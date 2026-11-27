-- America 360 — search indexes, least-privilege roles and row-level security.
set search_path = a360, public;

-- ---------------------------------------------------------------- search
-- unaccent() is STABLE; an IMMUTABLE wrapper is required for expression indexes.
create or replace function f_unaccent(text) returns text
  language sql immutable parallel safe strict
  as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Denormalized, pre-normalized search documents maintained by the seed/import
-- pipeline with the same normalize() used in fixture mode (src/lib/text.ts):
--   name_norm   = normalize(name + aliases)
--   search_text = normalize(name + aliases + description + type + category path names + area names)
alter table entities add column name_norm text not null default '';
alter table entities add column search_text text not null default '';
alter table areas add column name_norm text not null default '';
alter table areas add column search_text text not null default '';

create index entities_search_trgm on entities using gin (search_text gin_trgm_ops);
create index entities_name_trgm on entities using gin (name_norm gin_trgm_ops);
create index entities_search_fts on entities using gin (to_tsvector('simple', search_text));
create index areas_search_trgm on areas using gin (search_text gin_trgm_ops);
create index areas_name_trgm on areas using gin (name_norm gin_trgm_ops);

-- ---------------------------------------------------------------- roles
-- a360_read: read-only group role used by the website. The login user
-- (a360_reader) is created by scripts/db/migrate.ts with a password from env.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'a360_read') then
    create role a360_read nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'a360_write') then
    create role a360_write nologin;   -- future editor/admin API (Phase 2), no grants to raw DDL
  end if;
end $$;

grant usage on schema a360 to a360_read, a360_write;
grant select on sources, source_records, areas, area_aliases, area_relations, categories, entities, entity_aliases,
  entity_categories, entity_areas, entity_relations, entity_external_ids, slug_redirects, facts, media,
  coverage_universes to a360_read;
grant select, insert, update on entities, entity_aliases, entity_categories, entity_areas, entity_relations,
  facts, media, review_issues, slug_redirects to a360_write;
grant select on all tables in schema a360 to a360_write;
grant insert on audit_log to a360_write;
grant usage on all sequences in schema a360 to a360_write;

-- Aggregate-only view of the review queue for the public coverage page.
create view review_issue_counts with (security_barrier) as
  select kind, status, count(*)::int as n from review_issues group by kind, status;
grant select on review_issue_counts to a360_read;

-- ---------------------------------------------------------------- RLS
alter table entities enable row level security;
alter table areas enable row level security;
alter table facts enable row level security;
alter table media enable row level security;
alter table entity_relations enable row level security;
alter table entity_areas enable row level security;

create policy entities_public_read on entities for select to a360_read
  using (visibility = 'public' and review_status <> 'rejected');
create policy areas_public_read on areas for select to a360_read
  using (visibility = 'public' and review_status <> 'rejected');
create policy facts_public_read on facts for select to a360_read
  using (review_status <> 'rejected');
create policy media_public_read on media for select to a360_read using (true);
create policy entity_relations_public_read on entity_relations for select to a360_read
  using (review_status <> 'rejected');
create policy entity_areas_public_read on entity_areas for select to a360_read
  using (review_status <> 'rejected');

create policy entities_writer on entities for all to a360_write using (true) with check (true);
create policy areas_writer on areas for select to a360_write using (true);
create policy facts_writer on facts for all to a360_write using (true) with check (true);
create policy media_writer on media for all to a360_write using (true) with check (true);
create policy entity_relations_writer on entity_relations for all to a360_write using (true) with check (true);
create policy entity_areas_writer on entity_areas for all to a360_write using (true) with check (true);
