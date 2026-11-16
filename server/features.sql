-- CyberWar 0.10: player feedback + revenge attacks. Run after vip.sql.

-- 1) "Report a bug / idea": players can only INSERT their own reports; only you read them (SQL editor / Table editor)
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  username text,
  kind text not null check (kind in ('bug', 'idea', 'other')),
  body text not null check (char_length(body) between 3 and 1000),
  version text check (char_length(version) <= 20),
  device text check (char_length(device) <= 300),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "send own feedback" on public.feedback;
create policy "send own feedback" on public.feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
grant insert on public.feedback to authenticated;
revoke select, update, delete on public.feedback from anon, authenticated;
-- max 10 reports per player per day
create or replace function public.feedback_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.feedback f where f.user_id = new.user_id and f.created_at > now() - interval '1 day') >= 10 then
    raise exception 'feedback limit';
  end if;
  new.username := (select p.username from public.profiles p where p.id = new.user_id);
  return new;
end; $$;
drop trigger if exists feedback_limit on public.feedback;
create trigger feedback_limit before insert on public.feedback for each row execute function public.feedback_limit();

-- 6) Revenge: attack back whoever raided you (within 24 h, once per attack, ignores their shield)
alter table public.attacks add column if not exists revenged boolean not null default false;
create or replace function public.revenge_target(p_attack bigint)
returns table (user_id uuid, username text, trophies int, core int, layout jsonb, loot_scrap int, loot_copper int)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); a public.attacks%rowtype;
begin
  if uid is null then raise exception 'not logged in'; end if;
  select * into a from public.attacks where id = p_attack and defender = uid for update;
  if not found or a.attacker is null then raise exception 'revenge unavailable'; end if;
  if a.revenged then raise exception 'revenge used'; end if;
  if a.created_at < now() - interval '24 hours' then raise exception 'revenge expired'; end if;
  update public.attacks set revenged = true where id = p_attack;
  return query
    select b.user_id, b.username, b.trophies, b.core, b.layout, b.loot_scrap, b.loot_copper
    from public.bases b where b.user_id = a.attacker;
end; $$;
revoke execute on function public.revenge_target(bigint) from public, anon;
grant execute on function public.revenge_target(bigint) to authenticated;
