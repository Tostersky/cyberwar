-- CyberWar clans: clans, members, chat, troop requests. Run after economy.sql.
-- Clients can READ clans/members and their own clan's chat; every change goes through the functions below.

create table if not exists public.clans (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 3 and 20),
  description text not null default '' check (char_length(description) <= 120),
  emblem int not null default 0 check (emblem between 0 and 7),
  min_trophies int not null default 0 check (min_trophies between 0 and 5000),
  created_at timestamptz not null default now()
);
create unique index if not exists clans_name_lower on public.clans (lower(name));

create table if not exists public.clan_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  clan_id bigint not null references public.clans(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'elder', 'member')),
  joined_at timestamptz not null default now()
);
create index if not exists clan_members_clan on public.clan_members (clan_id);

create table if not exists public.clan_messages (
  id bigint generated always as identity primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  kind text not null default 'chat' check (kind in ('chat', 'request', 'system')),
  body text not null default '' check (char_length(body) <= 200),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists clan_messages_clan_id on public.clan_messages (clan_id, id);

-- donated units waiting to be picked up by the receiver's next game sync (written by the game server only)
create table if not exists public.clan_inbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit text not null,
  from_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists clan_inbox_user on public.clan_inbox (user_id);

alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.clan_messages enable row level security;
alter table public.clan_inbox enable row level security;

create or replace function public.my_clan() returns bigint
language sql stable security definer set search_path = '' as $$
  select clan_id from public.clan_members where user_id = auth.uid();
$$;

drop policy if exists "clans are public" on public.clans;
create policy "clans are public" on public.clans for select to authenticated using (true);
drop policy if exists "members are public" on public.clan_members;
create policy "members are public" on public.clan_members for select to authenticated using (true);
drop policy if exists "read own clan chat" on public.clan_messages;
create policy "read own clan chat" on public.clan_messages for select to authenticated using (clan_id = public.my_clan());

-- small helpers
create or replace function public._clan_sys(p_clan bigint, p_text text) returns void
language sql security definer set search_path = '' as $$
  insert into public.clan_messages (clan_id, username, kind, body) values (p_clan, 'SYSTEM', 'system', left(p_text, 200));
$$;
revoke execute on function public._clan_sys(bigint, text) from public, anon, authenticated;

create or replace function public._uname(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select username from public.profiles where id = p_user), '?');
$$;
revoke execute on function public._uname(uuid) from public, anon, authenticated;

-- create a clan (you become its leader)
create or replace function public.clan_create(p_name text, p_desc text, p_emblem int, p_min int) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid bigint; nm text := btrim(p_name);
begin
  if uid is null then raise exception 'not logged in'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already in a clan'; end if;
  if nm !~ '^[A-Za-z0-9 _\-]{3,20}$' then raise exception 'bad clan name'; end if;
  if exists (select 1 from public.clans where lower(name) = lower(nm)) then raise exception 'clan name taken'; end if;
  insert into public.clans (name, description, emblem, min_trophies)
    values (nm, left(coalesce(btrim(p_desc), ''), 120), greatest(0, least(7, coalesce(p_emblem, 0))), greatest(0, least(5000, coalesce(p_min, 0))))
    returning id into cid;
  insert into public.clan_members (user_id, clan_id, role) values (uid, cid, 'leader');
  perform public._clan_sys(cid, public._uname(uid) || ' założył klan / founded the clan');
  return cid;
end; $$;

-- join an open clan
create or replace function public.clan_join(p_clan bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); c public.clans%rowtype; tro int;
begin
  if uid is null then raise exception 'not logged in'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already in a clan'; end if;
  select * into c from public.clans where id = p_clan for update;
  if not found then raise exception 'no such clan'; end if;
  if (select count(*) from public.clan_members where clan_id = p_clan) >= 30 then raise exception 'clan full'; end if;
  select trophies into tro from public.profiles where id = uid;
  if coalesce(tro, 0) < c.min_trophies then raise exception 'not enough trophies'; end if;
  insert into public.clan_members (user_id, clan_id, role) values (uid, p_clan, 'member');
  perform public._clan_sys(p_clan, public._uname(uid) || ' dołączył / joined');
end; $$;

-- leave (a leaving leader hands over to the most senior member; an empty clan is deleted)
create or replace function public.clan_leave() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); m public.clan_members%rowtype; heir uuid;
begin
  select * into m from public.clan_members where user_id = uid;
  if not found then return; end if;
  delete from public.clan_members where user_id = uid;
  if not exists (select 1 from public.clan_members where clan_id = m.clan_id) then
    delete from public.clans where id = m.clan_id; return;
  end if;
  if m.role = 'leader' then
    select user_id into heir from public.clan_members where clan_id = m.clan_id
      order by (role = 'elder') desc, joined_at asc limit 1;
    update public.clan_members set role = 'leader' where user_id = heir;
    perform public._clan_sys(m.clan_id, public._uname(heir) || ' jest nowym liderem / is the new leader');
  end if;
  perform public._clan_sys(m.clan_id, public._uname(uid) || ' opuścił klan / left');
end; $$;

-- leader can kick anyone, elders can kick members
create or replace function public.clan_kick(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); me public.clan_members%rowtype; them public.clan_members%rowtype;
begin
  select * into me from public.clan_members where user_id = uid;
  select * into them from public.clan_members where user_id = p_user;
  if me.clan_id is null or them.clan_id is distinct from me.clan_id or p_user = uid then raise exception 'not allowed'; end if;
  if not (me.role = 'leader' or (me.role = 'elder' and them.role = 'member')) then raise exception 'not allowed'; end if;
  delete from public.clan_members where user_id = p_user;
  perform public._clan_sys(me.clan_id, public._uname(p_user) || ' został wyrzucony / was kicked');
end; $$;

-- leader promotes: member -> elder, elder -> leader (the old leader becomes an elder)
create or replace function public.clan_promote(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); me public.clan_members%rowtype; them public.clan_members%rowtype;
begin
  select * into me from public.clan_members where user_id = uid;
  select * into them from public.clan_members where user_id = p_user;
  if me.role is distinct from 'leader' or them.clan_id is distinct from me.clan_id or p_user = uid then raise exception 'not allowed'; end if;
  if them.role = 'member' then
    update public.clan_members set role = 'elder' where user_id = p_user;
    perform public._clan_sys(me.clan_id, public._uname(p_user) || ' jest teraz Starszym / is now an Elder');
  elsif them.role = 'elder' then
    update public.clan_members set role = 'elder' where user_id = uid;
    update public.clan_members set role = 'leader' where user_id = p_user;
    perform public._clan_sys(me.clan_id, public._uname(p_user) || ' jest nowym liderem / is the new leader');
  end if;
end; $$;

create or replace function public.clan_demote(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); me public.clan_members%rowtype; them public.clan_members%rowtype;
begin
  select * into me from public.clan_members where user_id = uid;
  select * into them from public.clan_members where user_id = p_user;
  if me.role is distinct from 'leader' or them.clan_id is distinct from me.clan_id or them.role <> 'elder' then raise exception 'not allowed'; end if;
  update public.clan_members set role = 'member' where user_id = p_user;
end; $$;

-- chat (1 message per second per player)
create or replace function public.clan_send(p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid bigint; txt text := left(btrim(coalesce(p_body, '')), 200);
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not in a clan'; end if;
  if txt = '' then return; end if;
  if exists (select 1 from public.clan_messages where user_id = uid and created_at > now() - interval '1 second') then raise exception 'too fast'; end if;
  insert into public.clan_messages (clan_id, user_id, username, kind, body) values (cid, uid, public._uname(uid), 'chat', txt);
end; $$;

-- ask clan mates for units (one open request; a new one at most every 2 minutes)
create or replace function public.clan_request(p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid bigint;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not in a clan'; end if;
  if exists (select 1 from public.clan_messages where user_id = uid and kind = 'request' and created_at > now() - interval '2 minutes') then raise exception 'too fast'; end if;
  update public.clan_messages set data = data || '{"closed": true}'::jsonb where user_id = uid and kind = 'request';
  insert into public.clan_messages (clan_id, user_id, username, kind, body, data)
    values (cid, uid, public._uname(uid), 'request', left(btrim(coalesce(p_body, '')), 120), '{"got": 0, "donors": {}}'::jsonb);
end; $$;

-- clan browser: best clans first, optional name filter
create or replace function public.clan_search(p_q text) returns table (id bigint, name text, description text, emblem int, min_trophies int, members int, trophies int)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name, c.description, c.emblem, c.min_trophies,
         count(m.user_id)::int as members, coalesce(sum(p.trophies), 0)::int as trophies
  from public.clans c
  left join public.clan_members m on m.clan_id = c.id
  left join public.profiles p on p.id = m.user_id
  where coalesce(p_q, '') = '' or c.name ilike '%' || p_q || '%'
  group by c.id
  order by trophies desc, c.id
  limit 30;
$$;

-- member list with names and trophies
create or replace function public.clan_roster(p_clan bigint) returns table (user_id uuid, username text, trophies int, role text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.username, p.trophies, m.role, m.joined_at
  from public.clan_members m join public.profiles p on p.id = m.user_id
  where m.clan_id = p_clan
  order by (m.role = 'leader') desc, (m.role = 'elder') desc, p.trophies desc;
$$;

do $$ declare f text; begin
  foreach f in array array['clan_create(text,text,int,int)', 'clan_join(bigint)', 'clan_leave()', 'clan_kick(uuid)', 'clan_promote(uuid)',
                           'clan_demote(uuid)', 'clan_send(text)', 'clan_request(text)', 'clan_search(text)', 'clan_roster(bigint)', 'my_clan()'] loop
    execute 'revoke execute on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;
