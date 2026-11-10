create table public.exhibits (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{22,64}$'),
  repo_owner text not null,
  repo_name text not null,
  commit_sha text not null check (commit_sha ~ '^[0-9a-f]{40}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint exhibits_expiry_after_creation check (expires_at > created_at)
);
create index exhibits_expiry_idx on public.exhibits (expires_at);
alter table public.exhibits enable row level security;
revoke all on table public.exhibits from public, anon, authenticated;
grant select, insert, update, delete on table public.exhibits to service_role;
comment on table public.exhibits is
  'Validated source evidence snapshots; server-only access. Public report routes enforce expiry. No raw job descriptions or full repository snapshots.';

