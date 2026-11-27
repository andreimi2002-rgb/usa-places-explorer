-- area_rank() must know the 'community' type added in 0005 (separate transaction:
-- PostgreSQL forbids using a new enum value in the transaction that adds it).
set search_path = a360, public;

create or replace function area_rank(t area_type) returns int
  language sql immutable parallel safe
  as $$ select case t
    when 'country' then 0 when 'state' then 1 when 'federal_district' then 1 when 'territory' then 1
    when 'region' then 2 when 'metro_area' then 2 when 'tribal_area' then 2
    when 'county' then 3 when 'municipality' then 4 when 'cdp' then 4 when 'community' then 4
    when 'neighborhood' then 5 end $$;
