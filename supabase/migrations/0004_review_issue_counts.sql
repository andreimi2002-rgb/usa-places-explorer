-- Aggregate-only view of open review issues per entity, readable by the website
-- role without exposing issue details (review_issues itself stays private).
set search_path = a360, public;

create view entity_open_issue_counts with (security_barrier) as
  select entity_id, kind, count(*)::int as n
  from review_issues
  where status = 'open' and entity_id is not null
  group by entity_id, kind;

grant select on entity_open_issue_counts to a360_read;
