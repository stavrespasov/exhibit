create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
create table private.exhibit_request_limits (
  bucket text primary key,
  requests integer not null default 0,
  expires_at timestamptz not null
);
create index exhibit_request_limits_expiry_idx on private.exhibit_request_limits(expires_at);
alter table private.exhibit_request_limits enable row level security;
revoke all on table private.exhibit_request_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.exhibit_request_limits to service_role;
create function public.reserve_exhibit_analysis(p_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ip_bucket text;
  day_bucket text;
  ip_count integer;
  day_count integer;
begin
  if p_key !~ '^[0-9a-f]{64}$' then return false; end if;
  ip_bucket := 'ip:' || p_key || ':' || floor(extract(epoch from now()) / 1800)::text;
  day_bucket := 'day:' || to_char(timezone('utc', now()), 'YYYYMMDD');
  delete from private.exhibit_request_limits where expires_at < now();
  insert into private.exhibit_request_limits(bucket, requests, expires_at)
  values(ip_bucket, 1, now() + interval '1 hour')
  on conflict (bucket) do update set requests = private.exhibit_request_limits.requests + 1
  returning requests into ip_count;
  if ip_count > 5 then return false; end if;
  insert into private.exhibit_request_limits(bucket, requests, expires_at)
  values(day_bucket, 1, now() + interval '2 days')
  on conflict (bucket) do update set requests = private.exhibit_request_limits.requests + 1
  returning requests into day_count;
  return day_count <= 50;
end;
$$;
revoke all on function public.reserve_exhibit_analysis(text) from public, anon, authenticated;
grant execute on function public.reserve_exhibit_analysis(text) to service_role;

