-- Prominence: number of Wikipedia language editions with an article (Wikidata sitelinks).
-- Used to feature well-known places and brands first; it is a popularity signal, not a fact.
set search_path = a360, public;

alter table entities add column if not exists prominence int not null default 0 check (prominence >= 0);
create index if not exists entities_prominence_idx on entities (prominence desc);

create or replace view entity_summaries with (security_invoker = true) as
  select e.id, e.slug, e.name, e.entity_type, e.short_description, e.review_status, e.name_norm, e.search_text,
         pc.slug as cat_slug, pc.name as cat_name, pc.name_ro as cat_name_ro, pc.domain_number,
         d.slug as dom_slug, d.name as dom_name, d.name_ro as dom_name_ro,
         pl.slug as place_slug, pl.name as place_label,
         img.url as image_url, img.alt as image_alt,
         e.prominence
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
  left join lateral (
    select m.url, m.alt from media m where m.entity_id = e.id and not m.ai_generated
    order by (m.kind = 'photo') desc, m.id limit 1
  ) img on true
  where e.visibility = 'public' and e.review_status <> 'rejected';
