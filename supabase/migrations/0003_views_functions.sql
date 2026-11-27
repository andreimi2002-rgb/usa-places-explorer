-- America 360 — read-side views and helper functions used by the website.
-- Views are security_invoker so row-level security of the caller applies.
set search_path = a360, public;

-- Display depth of an area type (deeper = more specific).
create or replace function area_rank(t area_type) returns int
  language sql immutable parallel safe
  as $$ select case t
    when 'country' then 0 when 'state' then 1 when 'federal_district' then 1 when 'territory' then 1
    when 'region' then 2 when 'metro_area' then 2 when 'tribal_area' then 2
    when 'county' then 3 when 'municipality' then 4 when 'cdp' then 4 when 'neighborhood' then 5 end $$;

-- An area and all of its descendants through the primary parent hierarchy.
create or replace function area_descendants(root uuid) returns setof uuid
  language sql stable
  as $$
    with recursive d(id) as (
      select root
      union
      select a.id from a360.areas a join d on a.parent_id = d.id
    ) select id from d $$;

-- Ancestors of an area, root first (excluding the area itself).
create or replace function area_ancestors(child uuid)
  returns table (id uuid, slug text, name text, area_type area_type, depth int)
  language sql stable
  as $$
    with recursive up(id, parent_id, slug, name, area_type, depth) as (
      select a.id, a.parent_id, a.slug, a.name, a.area_type, 0 from a360.areas a where a.id = child
      union all
      select p.id, p.parent_id, p.slug, p.name, p.area_type, up.depth + 1
      from a360.areas p join up on p.id = up.parent_id
      where up.depth < 20
    ) select id, slug, name, area_type, depth from up where depth > 0 order by depth desc $$;

create or replace function category_descendants(root uuid) returns setof uuid
  language sql stable
  as $$
    with recursive d(id) as (
      select root
      union
      select c.id from a360.categories c join d on c.parent_id = d.id
    ) select id from d $$;

create view category_paths with (security_invoker = true) as
  with recursive p(id, root_id, path, depth) as (
    select id, id, array[id], 0 from categories where parent_id is null
    union all
    select c.id, p.root_id, p.path || c.id, p.depth + 1 from categories c join p on c.parent_id = p.id
  ) select id, root_id, path, depth from p;

create view area_populations with (security_invoker = true) as
  select area_id, value_num::bigint as population_estimate, as_of
  from facts where key = 'population-estimate' and area_id is not null and review_status <> 'rejected';

-- One row per visible entity with its primary category, domain and best place label.
create view entity_summaries with (security_invoker = true) as
  select e.id, e.slug, e.name, e.entity_type, e.short_description, e.review_status, e.name_norm, e.search_text,
         pc.slug as cat_slug, pc.name as cat_name, pc.name_ro as cat_name_ro, pc.domain_number,
         d.slug as dom_slug, d.name as dom_name, d.name_ro as dom_name_ro,
         pl.slug as place_slug, pl.name as place_label
  from entities e
  join entity_categories ec on ec.entity_id = e.id and ec.is_primary
  join categories pc on pc.id = ec.category_id
  join category_paths cp on cp.id = pc.id
  join categories d on d.id = cp.root_id
  left join lateral (
    select a.slug, a.name
    from entity_areas ea join areas a on a.id = ea.area_id
    where ea.entity_id = e.id
    order by (ea.review_status in ('verified', 'reviewed', 'imported')) desc, area_rank(a.area_type) desc, a.slug collate "C"
    limit 1
  ) pl on true
  where e.visibility = 'public' and e.review_status <> 'rejected';

grant execute on function area_rank(area_type), area_descendants(uuid), area_ancestors(uuid), category_descendants(uuid) to a360_read, a360_write;
grant select on category_paths, area_populations, entity_summaries to a360_read, a360_write;
