-- CyberWar database schema (Supabase). Run once in the SQL editor.

-- Public player profiles (username is unique, case-insensitive)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  trophies int not null default 0,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,16}$')
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

-- One cloud save per player
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "read own save" on public.saves;
create policy "read own save" on public.saves for select using ((select auth.uid()) = user_id);
drop policy if exists "insert own save" on public.saves;
create policy "insert own save" on public.saves for insert with check ((select auth.uid()) = user_id);
drop policy if exists "update own save" on public.saves;
create policy "update own save" on public.saves for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Create the profile automatically when someone registers (username comes from sign-up metadata)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the registration form check a username before signing up
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select name ~ '^[A-Za-z0-9_]{3,16}$'
     and not exists (select 1 from public.profiles p where lower(p.username) = lower(name));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- "Delete account" button in Settings (GDPR right to erasure). Profile and save are removed by cascade.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
