-- CyberWar: log in with username OR email.
-- The game sends username + password; the email comes back ONLY if the password is correct,
-- so nobody can look up another player's email. 10 wrong passwords lock that username for 15 minutes.

create table if not exists public.login_attempts (
  username text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_user_time on public.login_attempts (lower(username), at);
alter table public.login_attempts enable row level security;  -- no policies: only the function below touches it

create or replace function public.email_for_login(p_username text, p_password text) returns text
language plpgsql security definer set search_path = '' as $$
declare em text; pw text; fails int;
begin
  if p_username is null or length(p_username) > 32 or p_password is null then return null; end if;
  select count(*) into fails from public.login_attempts a
    where lower(a.username) = lower(p_username) and a.at > now() - interval '15 minutes';
  if fails >= 10 then raise exception 'rate limit: too many attempts'; end if;
  select u.email, u.encrypted_password into em, pw
    from public.profiles p join auth.users u on u.id = p.id
    where lower(p.username) = lower(p_username);
  if em is null or pw is null or pw <> extensions.crypt(p_password, pw) then
    insert into public.login_attempts (username) values (p_username);
    delete from public.login_attempts a where a.at < now() - interval '1 day';
    return null;
  end if;
  delete from public.login_attempts a where lower(a.username) = lower(p_username);
  return em;
end; $$;
revoke execute on function public.email_for_login(text, text) from public;
grant execute on function public.email_for_login(text, text) to anon, authenticated;
