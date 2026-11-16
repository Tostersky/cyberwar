-- CyberWar push notifications: subscriptions, a send queue, server-generated secrets and a 5-minute cron.
create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sub jsonb not null,
  lang text not null default 'pl',
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user on public.push_subs (user_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated;

create table if not exists public.push_queue (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  send_at timestamptz not null,
  primary key (user_id, kind)
);
create index if not exists push_queue_due on public.push_queue (send_at);
alter table public.push_queue enable row level security;
revoke all on public.push_queue from anon, authenticated;

-- secrets created by the database / server itself (never typed by a person)
create table if not exists public.app_secrets (k text primary key, v text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
insert into public.app_secrets (k, v) values ('cron', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (k) do nothing;

-- every 5 minutes: ask the game server to send due notifications
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'cyberwar-push';
select cron.schedule('cyberwar-push', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://cpwfatmoztysettztnyo.supabase.co/functions/v1/game',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('cron', (select v from public.app_secrets where k = 'cron'))
  );
$$);
