-- CyberWar: the developer (admin accounts) can read and triage player feedback inside the game.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "see own admin row" on public.admins;
create policy "see own admin row" on public.admins for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.admins to authenticated;

-- the developer's account
insert into public.admins (user_id) select id from public.profiles where username = 'TSR' on conflict do nothing;

-- triage columns
alter table public.feedback add column if not exists status text not null default 'new';
alter table public.feedback add column if not exists note text;
alter table public.feedback drop constraint if exists feedback_status_check;
alter table public.feedback add constraint feedback_status_check check (status in ('new', 'doing', 'done', 'rejected'));

-- only admins can read / update reports (players can still only insert their own)
grant select, update (status, note) on public.feedback to authenticated;
drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback" on public.feedback for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
drop policy if exists "admins update feedback" on public.feedback;
create policy "admins update feedback" on public.feedback for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
