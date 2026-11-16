-- CyberWar PvP (asynchronous attacks on other players' bases). Run after schema.sql.

-- Trophies are now changed only by the server
drop policy if exists "update own profile" on public.profiles;

-- Public snapshot of each player's base, used as the opponent in PvP
create table if not exists public.bases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  trophies int not null default 0,
  core int not null default 1,
  layout jsonb not null,
  loot_scrap int not null default 0,
  loot_copper int not null default 0,
  shield_until timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bases enable row level security;
-- no direct access: everything goes through the functions below

-- Attack log (attacker sees own attacks, defender sees attacks on them)
create table if not exists public.attacks (
  id bigint generated always as identity primary key,
  attacker uuid references auth.users(id) on delete set null,
  attacker_name text not null,
  defender uuid not null references auth.users(id) on delete cascade,
  stars int not null,
  pct int not null,
  loot_scrap int not null,
  loot_copper int not null,
  trophies int not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists attacks_defender_unseen on public.attacks (defender) where not seen;
create index if not exists attacks_attacker_time on public.attacks (attacker, created_at desc);
alter table public.attacks enable row level security;
drop policy if exists "read own attacks" on public.attacks;
create policy "read own attacks" on public.attacks for select
  using ((select auth.uid()) = defender or (select auth.uid()) = attacker);

-- Save my base snapshot (called by the game when it syncs)
create or replace function public.publish_base(p_layout jsonb, p_core int, p_scrap int, p_copper int) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not logged in'; end if;
  if jsonb_typeof(p_layout) <> 'array' or jsonb_array_length(p_layout) > 400 then raise exception 'bad layout'; end if;
  insert into public.bases (user_id, username, trophies, core, layout, loot_scrap, loot_copper, updated_at)
  select uid, p.username, p.trophies, greatest(1, least(5, p_core)), p_layout,
         greatest(0, least(1000000, p_scrap)), greatest(0, least(1000000, p_copper)), now()
  from public.profiles p where p.id = uid
  on conflict (user_id) do update set username = excluded.username, trophies = excluded.trophies, core = excluded.core,
    layout = excluded.layout, loot_scrap = excluded.loot_scrap, loot_copper = excluded.loot_copper, updated_at = now();
end; $$;

-- Find an opponent with similar trophies (not me, not shielded, active in the last 30 days)
create or replace function public.find_opponent()
returns table (user_id uuid, username text, trophies int, core int, layout jsonb, loot_scrap int, loot_copper int)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); my int;
begin
  if uid is null then raise exception 'not logged in'; end if;
  select p.trophies into my from public.profiles p where p.id = uid;
  return query
    select b.user_id, b.username, b.trophies, b.core, b.layout, b.loot_scrap, b.loot_copper
    from public.bases b
    where b.user_id <> uid and b.shield_until < now() and b.updated_at > now() - interval '30 days'
    order by abs(b.trophies - coalesce(my, 0)) + random() * 300
    limit 1;
end; $$;

-- Report the result of an attack. The server caps the loot and decides trophies and shields.
create or replace function public.submit_attack(p_defender uuid, p_stars int, p_pct int, p_scrap int, p_copper int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  b public.bases%rowtype;
  att_tro int; att_name text;
  st int := greatest(0, least(3, p_stars));
  pc int := greatest(0, least(100, p_pct));
  s int; c int; delta int; def_change int;
begin
  if uid is null then raise exception 'not logged in'; end if;
  if uid = p_defender then raise exception 'cannot attack yourself'; end if;
  if exists (select 1 from public.attacks a where a.attacker = uid and a.created_at > now() - interval '15 seconds') then
    raise exception 'too fast';
  end if;
  select * into b from public.bases where user_id = p_defender for update;
  if not found then raise exception 'no such base'; end if;
  select p.trophies, p.username into att_tro, att_name from public.profiles p where p.id = uid;

  s := greatest(0, least(p_scrap, b.loot_scrap));
  c := greatest(0, least(p_copper, b.loot_copper));
  if st > 0 then
    delta := greatest(2, least(40, 8 + st * 6 + (b.trophies - att_tro) / 50));
    def_change := -least(delta, b.trophies);
  else
    delta := -least(10, att_tro);
    def_change := least(10, att_tro);
    s := 0; c := 0;
  end if;

  update public.profiles set trophies = trophies + delta where id = uid;
  update public.profiles set trophies = trophies + def_change where id = p_defender;
  update public.bases set trophies = trophies + def_change, loot_scrap = loot_scrap - s, loot_copper = loot_copper - c,
    shield_until = case when st >= 2 then now() + interval '8 hours' when st = 1 then now() + interval '4 hours' else shield_until end
    where user_id = p_defender;
  update public.bases set trophies = trophies + delta, shield_until = now() where user_id = uid;
  insert into public.attacks (attacker, attacker_name, defender, stars, pct, loot_scrap, loot_copper, trophies)
    values (uid, att_name, p_defender, st, pc, s, c, delta);
  return delta;
end; $$;

-- Defender confirms they have seen (and applied) their defense reports
create or replace function public.mark_attacks_seen() returns void
language sql security definer set search_path = '' as $$
  update public.attacks set seen = true where defender = auth.uid() and not seen;
$$;

revoke execute on function public.publish_base(jsonb, int, int, int) from public, anon;
revoke execute on function public.find_opponent() from public, anon;
revoke execute on function public.submit_attack(uuid, int, int, int, int) from public, anon;
revoke execute on function public.mark_attacks_seen() from public, anon;
grant execute on function public.publish_base(jsonb, int, int, int) to authenticated;
grant execute on function public.find_opponent() to authenticated;
grant execute on function public.submit_attack(uuid, int, int, int, int) to authenticated;
grant execute on function public.mark_attacks_seen() to authenticated;
