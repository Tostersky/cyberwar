-- CyberWar: find other players by nickname and look at their village (read-only).
create or replace function public.search_players(p_q text)
returns table (user_id uuid, username text, trophies int, core int, vip boolean, clan text)
language plpgsql stable security definer set search_path = '' as $$
declare q text := btrim(coalesce(p_q, ''));
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if char_length(q) < 2 then return; end if;
  q := replace(replace(replace(left(q, 16), '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select p.id, p.username, p.trophies, coalesce(b.core, 1), coalesce(p.vip_until > now(), false), c.name
    from public.profiles p
    left join public.bases b on b.user_id = p.id
    left join public.clan_members m on m.user_id = p.id
    left join public.clans c on c.id = m.clan_id
    where p.username ilike '%' || q || '%'
    order by (lower(p.username) = lower(btrim(p_q))) desc, p.trophies desc
    limit 20;
end; $$;
revoke execute on function public.search_players(text) from public, anon;
grant execute on function public.search_players(text) to authenticated;

create or replace function public.view_base(p_user uuid)
returns table (username text, trophies int, core int, layout jsonb)
language sql stable security definer set search_path = '' as $$
  select b.username, b.trophies, b.core, b.layout from public.bases b where b.user_id = p_user and auth.uid() is not null;
$$;
revoke execute on function public.view_base(uuid) from public, anon;
grant execute on function public.view_base(uuid) to authenticated;
