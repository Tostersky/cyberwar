-- CyberWar VIP: monthly Google Play subscription (product id vip_monthly).
-- Only the game server (service role) writes these; players can't update profiles (no update policy).
alter table public.profiles add column if not exists vip_until timestamptz;

create table if not exists public.subscriptions (
  token text primary key,
  user_id uuid references auth.users(id) on delete set null,
  product text not null,
  expiry timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- member list now also says who is VIP (gold badge)
drop function if exists public.clan_roster(bigint);
create function public.clan_roster(p_clan bigint) returns table (user_id uuid, username text, trophies int, role text, joined_at timestamptz, vip boolean)
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.username, p.trophies, m.role, m.joined_at, coalesce(p.vip_until > now(), false)
  from public.clan_members m join public.profiles p on p.id = m.user_id
  where m.clan_id = p_clan
  order by (m.role = 'leader') desc, (m.role = 'elder') desc, p.trophies desc;
$$;
revoke execute on function public.clan_roster(bigint) from public, anon;
grant execute on function public.clan_roster(bigint) to authenticated;
