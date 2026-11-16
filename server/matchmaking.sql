-- CyberWar matchmaking: opponents with a similar Core level first (±1), then similar trophies.
-- Not shielded, active in the last 30 days, never yourself.
create or replace function public.find_opponent()
returns table (user_id uuid, username text, trophies int, core int, layout jsonb, loot_scrap int, loot_copper int)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); my int; mycore int;
begin
  if uid is null then raise exception 'not logged in'; end if;
  select p.trophies into my from public.profiles p where p.id = uid;
  select b.core into mycore from public.bases b where b.user_id = uid;
  mycore := coalesce(mycore, 1);
  return query
    select b.user_id, b.username, b.trophies, b.core, b.layout, b.loot_scrap, b.loot_copper
    from public.bases b
    where b.user_id <> uid and b.shield_until < now() and b.updated_at > now() - interval '30 days'
    order by (abs(b.core - mycore) > 1) asc, abs(b.trophies - coalesce(my, 0)) + abs(b.core - mycore) * 150 + random() * 300
    limit 1;
end; $$;
revoke execute on function public.find_opponent() from public, anon;
grant execute on function public.find_opponent() to authenticated;

-- replays + the defender's Core level are kept with each attack
alter table public.attacks add column if not exists replay jsonb;
