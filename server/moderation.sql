-- CyberWar: chat moderation (required by Google Play for apps with user content):
-- profanity filter, report & block players, admin tools (delete message, mute player).

-- 1) profanity filter (Polish + English stems, any case, also inside longer words)
create or replace function public._clean(p_txt text) returns text
language plpgsql immutable set search_path = '' as $$
declare t text := coalesce(p_txt, ''); stem text;
  stems text[] := array['kurw','chuj','huj','pierdol','pierdal','jeb','pizd','skurw','kutas','dziwk','szmat','cwel','pedał','spierd','wypierd','zajeb','debil','idiot','frajer',
                        'fuck','shit','bitch','cunt','dick','asshole','nigg','fagg','whore','retard','slut','bastard'];
begin
  foreach stem in array stems loop
    t := regexp_replace(t, '[[:alpha:]]*' || stem || '[[:alpha:]]*', '***', 'gi');
  end loop;
  return t;
end; $$;

-- 2) chat bans (set by admins), checked when sending
create table if not exists public.chat_bans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  until timestamptz not null
);
alter table public.chat_bans enable row level security;
revoke all on public.chat_bans from anon, authenticated;

create or replace function public.clan_send(p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid bigint; txt text := left(btrim(coalesce(p_body, '')), 200);
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not in a clan'; end if;
  if txt = '' then return; end if;
  if exists (select 1 from public.chat_bans b where b.user_id = uid and b.until > now()) then raise exception 'chat muted'; end if;
  if exists (select 1 from public.clan_messages where user_id = uid and created_at > now() - interval '1 second') then raise exception 'too fast'; end if;
  insert into public.clan_messages (clan_id, user_id, username, kind, body) values (cid, uid, public._uname(uid), 'chat', public._clean(txt));
end; $$;

-- clan names / descriptions are filtered too (paid creation goes through clan_create_for)
create or replace function public.clan_create_for(p_user uuid, p_name text, p_desc text, p_emblem int, p_min int) returns bigint
language plpgsql security definer set search_path = '' as $$
declare cid bigint; nm text := btrim(p_name);
begin
  if p_user is null then raise exception 'not logged in'; end if;
  if exists (select 1 from public.clan_members where user_id = p_user) then raise exception 'already in a clan'; end if;
  if nm !~ '^[A-Za-z0-9 _\-]{3,20}$' or public._clean(nm) <> nm then raise exception 'bad clan name'; end if;
  if exists (select 1 from public.clans where lower(name) = lower(nm)) then raise exception 'clan name taken'; end if;
  insert into public.clans (name, description, emblem, min_trophies)
    values (nm, public._clean(left(coalesce(btrim(p_desc), ''), 120)), greatest(0, least(7, coalesce(p_emblem, 0))), greatest(0, least(5000, coalesce(p_min, 0))))
    returning id into cid;
  insert into public.clan_members (user_id, clan_id, role) values (p_user, cid, 'leader');
  perform public._clan_sys(cid, public._uname(p_user) || ' założył klan / founded the clan');
  return cid;
end; $$;
revoke execute on function public.clan_create_for(uuid, text, text, int, int) from public, anon, authenticated;
grant execute on function public.clan_create_for(uuid, text, text, int, int) to service_role;

-- offensive usernames can't be registered
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select name ~ '^[A-Za-z0-9_]{3,16}$' and public._clean(name) = name
     and not exists (select 1 from public.profiles p where lower(p.username) = lower(name));
$$;
grant execute on function public.username_available(text) to anon, authenticated;
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public._clean(new.raw_user_meta_data->>'username') <> (new.raw_user_meta_data->>'username') then raise exception 'bad username'; end if;
  insert into public.profiles (id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end; $$;

-- 3) block list: each player manages their own
create table if not exists public.blocks (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocked_name text,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists "own blocks" on public.blocks;
create policy "own blocks" on public.blocks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, delete on public.blocks to authenticated;

-- 4) reports go to the feedback sheet (kind 'report', with the reported player and message)
alter table public.feedback add column if not exists target_user uuid;
alter table public.feedback add column if not exists target_msg bigint;
alter table public.feedback drop constraint if exists feedback_kind_check;
alter table public.feedback add constraint feedback_kind_check check (kind in ('bug', 'idea', 'other', 'report'));

-- 5) admin tools
drop policy if exists "admins delete messages" on public.clan_messages;
create policy "admins delete messages" on public.clan_messages for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
grant delete on public.clan_messages to authenticated;

create or replace function public.admin_mute(p_user uuid, p_days int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then raise exception 'not allowed'; end if;
  insert into public.chat_bans (user_id, until) values (p_user, now() + make_interval(days => greatest(0, least(365, p_days))))
    on conflict (user_id) do update set until = excluded.until;
end; $$;
revoke execute on function public.admin_mute(uuid, int) from public, anon;
grant execute on function public.admin_mute(uuid, int) to authenticated;
