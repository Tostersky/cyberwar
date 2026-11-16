-- CyberWar: Google Play chip purchases. Only the game server (service role) reads/writes this table.
-- The purchase token is the primary key, so one purchase can never be credited twice.
create table if not exists public.purchases (
  token text primary key,
  user_id uuid references auth.users(id) on delete set null,
  product text not null,
  chips int not null,
  order_id text,
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
revoke all on public.purchases from anon, authenticated;
create index if not exists purchases_user_idx on public.purchases (user_id);
