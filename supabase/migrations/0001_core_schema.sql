-- America 360 — core schema (v1). PostgreSQL 15+ with PostGIS 3.
-- Compatible with local docker compose and with Supabase (extensions schema aside).
-- Mirrors src/lib/data/dataset.ts; documented in docs/DATA_DICTIONARY.md.

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create schema if not exists a360;
set search_path = a360, public;

-- ---------------------------------------------------------------- enums
create type review_status as enum ('imported', 'unreviewed', 'reviewed', 'verified', 'stale', 'rejected');
create type visibility as enum ('public', 'hidden', 'draft');
create type area_type as enum ('country', 'state', 'federal_district', 'territory', 'county', 'municipality', 'cdp',
  'neighborhood', 'region', 'metro_area', 'tribal_area');
create type source_kind as enum ('dataset', 'official_website', 'directory', 'reference');
create type entity_status as enum ('active', 'closed', 'historical', 'unknown');

-- ---------------------------------------------------------------- provenance
create table sources (
  id                  text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind                source_kind not null,
  title               text not null,
  publisher           text not null,
  url                 text not null,
  dataset_version     text,
  license             text not null,
  terms_url           text,
  redisplay_permitted boolean not null,
  coverage            text,
  expected_fields     text[] not null default '{}',
  retrieval_method    text,
  refresh_interval    text,
  limitations         text,
  retrieved_at        timestamptz,
  checksum_sha256     text check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  entity_id           uuid,          -- set for an entity's official website (FK added below)
  created_at          timestamptz not null default now()
);

create table import_runs (
  id              uuid primary key default gen_random_uuid(),
  adapter         text not null,
  source_ids      text[] not null default '{}',
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text not null default 'running' check (status in ('running', 'succeeded', 'failed', 'rolled_back')),
  dry_run         boolean not null default false,
  schema_version  text not null,
  input_checksum  text,
  counts          jsonb not null default '{}',
  error           text
);

create table source_records (
  id              uuid primary key,
  source_id       text not null references sources(id) on delete cascade,
  import_run_id   uuid references import_runs(id) on delete set null,
  external_ref    text,
  retrieved_at    timestamptz not null,
  http_status     int,
  outcome         text not null,
  page_title      text,
  final_url       text,
  checksum_sha256 text,
  raw             jsonb             -- only when the source license permits storing it
);
create index source_records_source_idx on source_records (source_id, retrieved_at desc);

-- ---------------------------------------------------------------- geography
create table areas (
  id              uuid primary key,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  official_name   text,
  area_type       area_type not null,
  type_label      text,
  parent_id       uuid references areas(id) on delete restrict,
  geoid           text,
  fips            text,
  ansi            text,
  usps            text,
  funcstat        text,
  land_area_sqmi  numeric(12,3) check (land_area_sqmi >= 0),
  water_area_sqmi numeric(12,3) check (water_area_sqmi >= 0),
  internal_point  geography(Point, 4326),
  geom            geometry(MultiPolygon, 4326),
  geom_source_id  text references sources(id),
  summary         text,
  boundary_note   text,
  program_status  text not null default 'registry_only' check (program_status in ('active', 'registry_only')),
  review_status   review_status not null,
  source_ids      text[] not null default '{}',
  visibility      visibility not null default 'public',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint areas_geoid_unique unique (area_type, geoid),
  constraint areas_no_self_parent check (parent_id is null or parent_id <> id)
);
create index areas_parent_idx on areas (parent_id);
create index areas_type_idx on areas (area_type);
create index areas_point_gix on areas using gist (internal_point);
create index areas_geom_gix on areas using gist (geom);

create table area_aliases (
  area_id uuid not null references areas(id) on delete cascade,
  alias   text not null,
  primary key (area_id, alias)
);

create table area_relations (
  id               uuid primary key,
  area_id          uuid not null references areas(id) on delete cascade,
  related_area_id  uuid not null references areas(id) on delete cascade,
  relation_type    text not null check (relation_type in ('intersects', 'contains_internal_point_of', 'adjacent_to', 'consolidated_with')),
  source_id        text not null references sources(id),
  method           text,
  review_status    review_status not null,
  unique (area_id, related_area_id, relation_type)
);
create index area_relations_related_idx on area_relations (related_area_id);

-- ---------------------------------------------------------------- taxonomy
create table categories (
  id            uuid primary key,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null,
  name_ro       text,
  description   text,
  parent_id     uuid references categories(id) on delete restrict,
  domain_number int not null check (domain_number between 1 and 999),
  depth         int not null check (depth >= 0),
  sort_order    int not null default 0
);
create index categories_parent_idx on categories (parent_id);

-- ---------------------------------------------------------------- entities
create table entities (
  id                 uuid primary key,
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name               text not null,
  entity_type        text not null,
  status             entity_status not null default 'unknown',
  short_description  text check (char_length(short_description) <= 280),
  long_description   text,
  official_url       text,
  -- Coordinates only when sourced; sensitive entities (e.g. species) never get one.
  location           geography(Point, 4326),
  sensitive_location boolean not null default false,
  visibility         visibility not null default 'public',
  review_status      review_status not null,
  primary_source_id  text references sources(id),
  attributes         jsonb not null default '{}',  -- validated per entity_type in the application layer
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  verified_at        timestamptz,
  constraint entities_sensitive_no_point check (not (sensitive_location and location is not null))
);
create index entities_type_idx on entities (entity_type);
create index entities_location_gix on entities using gist (location);

alter table sources add constraint sources_entity_fk foreign key (entity_id) references entities(id) on delete cascade deferrable initially deferred;

create table entity_aliases (
  entity_id uuid not null references entities(id) on delete cascade,
  alias     text not null,
  primary key (entity_id, alias)
);

create table entity_categories (
  entity_id   uuid not null references entities(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  is_primary  boolean not null default false,
  primary key (entity_id, category_id)
);
create unique index entity_categories_one_primary on entity_categories (entity_id) where is_primary;
create index entity_categories_category_idx on entity_categories (category_id);

create table entity_areas (
  entity_id     uuid not null references entities(id) on delete cascade,
  area_id       uuid not null references areas(id) on delete restrict,
  relation_type text not null check (relation_type in ('located_in', 'headquartered_in', 'serves', 'operates_in', 'crosses', 'documented_in')),
  review_status review_status not null,
  evidence      text,
  verified_at   timestamptz,
  note          text,
  primary key (entity_id, area_id, relation_type)
);
create index entity_areas_area_idx on entity_areas (area_id);

create table entity_relations (
  id             uuid primary key,
  from_entity_id uuid not null references entities(id) on delete cascade,
  to_entity_id   uuid not null references entities(id) on delete cascade,
  relation_type  text not null check (relation_type in ('home_venue', 'operated_by', 'brand_of', 'affiliated_with', 'part_of', 'on_waterway', 'crosses', 'managed_by')),
  source_id      text references sources(id),
  evidence       text,
  review_status  review_status not null,
  verified_at    timestamptz,
  unique (from_entity_id, relation_type, to_entity_id),
  check (from_entity_id <> to_entity_id)
);
create index entity_relations_to_idx on entity_relations (to_entity_id);

create table entity_external_ids (
  entity_id   uuid not null references entities(id) on delete cascade,
  provider    text not null,
  external_id text not null,
  primary key (provider, external_id)
);

-- Merged or renamed slugs keep working.
create table slug_redirects (
  kind       text not null check (kind in ('entity', 'area', 'category')),
  old_slug   text not null,
  target_id  uuid not null,
  created_at timestamptz not null default now(),
  primary key (kind, old_slug)
);

-- ---------------------------------------------------------------- facts & media
create table facts (
  id            uuid primary key,
  area_id       uuid references areas(id) on delete cascade,
  entity_id     uuid references entities(id) on delete cascade,
  key           text not null,
  value_text    text,
  value_num     numeric,
  unit          text,
  as_of         date,
  as_of_label   text,
  source_id     text not null references sources(id),
  source_ref    text,
  review_status review_status not null,
  verified_at   timestamptz,
  note          text,
  check ((area_id is null) <> (entity_id is null)),
  check ((value_text is null) <> (value_num is null))
);
create index facts_area_idx on facts (area_id, key);
create index facts_entity_idx on facts (entity_id, key);

create table media (
  id           uuid primary key,
  area_id      uuid references areas(id) on delete cascade,
  entity_id    uuid references entities(id) on delete cascade,
  kind         text not null check (kind in ('photo', 'ai_visual', 'illustration')),
  url          text not null,
  page_url     text not null,
  alt          text not null check (char_length(alt) >= 5),
  credit       text not null,
  license      text not null,
  license_url  text not null,
  year         int,
  ai_generated boolean not null,
  check ((area_id is null) <> (entity_id is null)),
  -- AI visuals are never presented as photographs.
  check (not (ai_generated and kind = 'photo'))
);

-- ---------------------------------------------------------------- review, coverage, audit
create table review_issues (
  id         uuid primary key,
  kind       text not null,
  entity_id  uuid references entities(id) on delete cascade,
  area_id    uuid references areas(id) on delete cascade,
  source_id  text references sources(id) on delete set null,
  detail     text not null,
  status     text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);
create index review_issues_open_idx on review_issues (status, kind);

create table coverage_universes (
  id          text primary key,
  area_id     uuid not null references areas(id) on delete cascade,
  label       text not null,
  definition  text not null,
  area_type   area_type,
  category_id uuid references categories(id),
  denominator int not null check (denominator > 0),
  as_of       date not null,
  source_id   text not null references sources(id)
);

create table audit_log (
  id         bigserial primary key,
  table_name text not null,
  row_id     text not null,
  action     text not null check (action in ('insert', 'update', 'delete')),
  before     jsonb,
  after      jsonb,
  actor      text not null default current_user,
  at         timestamptz not null default now()
);

create or replace function audit_row() returns trigger language plpgsql as $$
begin
  insert into a360.audit_log (table_name, row_id, action, before, after)
  values (
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id', '?'),
    lower(tg_op),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return null;
end $$;

-- Audit editorial tables (bulk geographic imports are tracked by import_runs instead).
create trigger entities_audit after insert or update or delete on entities for each row execute function audit_row();
create trigger facts_audit after update or delete on facts for each row execute function audit_row();
create trigger entity_relations_audit after insert or update or delete on entity_relations for each row execute function audit_row();
