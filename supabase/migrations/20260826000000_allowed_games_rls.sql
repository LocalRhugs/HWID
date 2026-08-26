-- allowed_games is managed by the password-gated Vercel server functions.
-- Browser clients retain read-only access only when a matching policy exists.

create table if not exists public.allowed_games (
  game_id text primary key,
  name text,
  enabled boolean not null default true,
  script_url text,
  universe_id text,
  is_paid boolean not null default false,
  no_timer boolean not null default false,
  session_seconds integer,
  cooldown_seconds integer,
  added_at timestamptz not null default now()
);

alter table public.allowed_games enable row level security;

grant select on table public.allowed_games to anon, authenticated;
revoke insert, update, delete on table public.allowed_games from anon, authenticated;

drop policy if exists "allowed_games_public_select" on public.allowed_games;
create policy "allowed_games_public_select"
  on public.allowed_games for select
  to anon, authenticated
  using (true);

-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. These
-- explicit grants document the intended privileged path without exposing
-- mutation privileges to browser roles.
grant select, insert, update, delete on table public.allowed_games to service_role;
grant usage, select on all sequences in schema public to service_role;
