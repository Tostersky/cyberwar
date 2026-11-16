-- CyberWar: the game server (Edge Function "game") now owns all saves. Run after pvp.sql.

-- players can still READ their save, but only the server may write it
drop policy if exists "insert own save" on public.saves;
drop policy if exists "update own save" on public.saves;

-- the base snapshot is published by the server too
revoke execute on function public.publish_base(jsonb, int, int, int) from authenticated;

-- PvP loot is credited to the attacker exactly once
alter table public.attacks add column if not exists credited boolean not null default false;

-- submit_attack now also returns the attack id, so the server can credit the loot
drop function if exists public.submit_attack(uuid, int, int, int, int);
create function public.submit_attack(p_defender uuid, p_stars int, p_pct int, p_scrap int, p_copper int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  b public.bases%rowtype;
  att_tro int; att_name text;
  st int := greatest(0, least(3, p_stars));
  pc int := greatest(0, least(100, p_pct));
  s int; c int; delta int; def_change int; new_id bigint;
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
    values (uid, att_name, p_defender, st, pc, s, c, delta) returning id into new_id;
  return jsonb_build_object('delta', delta, 'id', new_id);
end; $$;
revoke execute on function public.submit_attack(uuid, int, int, int, int) from public, anon;
grant execute on function public.submit_attack(uuid, int, int, int, int) to authenticated;
