-- CyberWar anti-cheat: attacks on real players are recorded only by the game server (after it checked the battle).
-- Players can no longer call submit_attack themselves.
revoke execute on function public.submit_attack(uuid, int, int, int, int) from public, anon, authenticated;

create or replace function public.submit_attack_for(p_attacker uuid, p_defender uuid, p_stars int, p_pct int, p_scrap int, p_copper int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.bases%rowtype;
  att_tro int; att_name text;
  st int := greatest(0, least(3, p_stars));
  pc int := greatest(0, least(100, p_pct));
  s int; c int; delta int; def_change int; new_id bigint;
begin
  if p_attacker is null or p_attacker = p_defender then raise exception 'bad attack'; end if;
  if exists (select 1 from public.attacks a where a.attacker = p_attacker and a.created_at > now() - interval '15 seconds') then
    raise exception 'too fast';
  end if;
  select * into b from public.bases where user_id = p_defender for update;
  if not found then raise exception 'no such base'; end if;
  select p.trophies, p.username into att_tro, att_name from public.profiles p where p.id = p_attacker;
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
  update public.profiles set trophies = trophies + delta where id = p_attacker;
  update public.profiles set trophies = trophies + def_change where id = p_defender;
  update public.bases set trophies = trophies + def_change, loot_scrap = loot_scrap - s, loot_copper = loot_copper - c,
    shield_until = case when st >= 2 then now() + interval '8 hours' when st = 1 then now() + interval '4 hours' else shield_until end
    where user_id = p_defender;
  update public.bases set trophies = trophies + delta, shield_until = now() where user_id = p_attacker;
  insert into public.attacks (attacker, attacker_name, defender, stars, pct, loot_scrap, loot_copper, trophies, credited)
    values (p_attacker, att_name, p_defender, st, pc, s, c, delta, true) returning id into new_id;
  return jsonb_build_object('delta', delta, 'id', new_id, 'scrap', s, 'copper', c);
end; $$;
revoke execute on function public.submit_attack_for(uuid, uuid, int, int, int, int) from public, anon, authenticated;
grant execute on function public.submit_attack_for(uuid, uuid, int, int, int, int) to service_role;
