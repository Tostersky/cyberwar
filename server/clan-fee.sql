-- CyberWar: creating a clan is paid (premium chips), so only the game server may create clans.
-- Players lose direct access to clan_create; the Edge Function charges the fee and calls clan_create_for.

revoke execute on function public.clan_create(text, text, int, int) from public, anon, authenticated;

create or replace function public.clan_create_for(p_user uuid, p_name text, p_desc text, p_emblem int, p_min int) returns bigint
language plpgsql security definer set search_path = '' as $$
declare cid bigint; nm text := btrim(p_name);
begin
  if p_user is null then raise exception 'not logged in'; end if;
  if exists (select 1 from public.clan_members where user_id = p_user) then raise exception 'already in a clan'; end if;
  if nm !~ '^[A-Za-z0-9 _\-]{3,20}$' then raise exception 'bad clan name'; end if;
  if exists (select 1 from public.clans where lower(name) = lower(nm)) then raise exception 'clan name taken'; end if;
  insert into public.clans (name, description, emblem, min_trophies)
    values (nm, left(coalesce(btrim(p_desc), ''), 120), greatest(0, least(7, coalesce(p_emblem, 0))), greatest(0, least(5000, coalesce(p_min, 0))))
    returning id into cid;
  insert into public.clan_members (user_id, clan_id, role) values (p_user, cid, 'leader');
  perform public._clan_sys(cid, public._uname(p_user) || ' założył klan / founded the clan');
  return cid;
end; $$;
revoke execute on function public.clan_create_for(uuid, text, text, int, int) from public, anon, authenticated;
grant execute on function public.clan_create_for(uuid, text, text, int, int) to service_role;
