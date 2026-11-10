begin;

create table public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('credentials', 'google', 'naver', 'kakao')),
  subject text not null,
  email text,
  username text unique check (username ~ '^[a-z][a-z0-9_]{3,23}$'),
  email_verified boolean not null default false,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  unique (provider, subject)
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.app_accounts(id) on delete set null,
  action text not null,
  outcome text not null check (outcome in ('success', 'failure')),
  created_at timestamptz not null default now()
);
create index activity_logs_created on public.activity_logs(created_at desc, id desc);
create index activity_logs_actor on public.activity_logs(actor_id, created_at desc);

create table public.auth_attempts (
  key text primary key,
  attempts integer not null,
  window_start timestamptz not null
);

alter table public.app_accounts enable row level security;
alter table public.activity_logs enable row level security;
alter table public.auth_attempts enable row level security;
revoke all on public.app_accounts, public.activity_logs, public.auth_attempts from anon, authenticated;
grant select, insert, update on public.app_accounts to service_role;
grant select, insert on public.activity_logs to service_role;
grant usage, select on sequence public.activity_logs_id_seq to service_role;

create function public.sync_email_account() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_accounts(provider, subject, email, username, email_verified)
  values ('credentials', new.id::text, lower(new.email), nullif(lower(new.raw_user_meta_data->>'username'), ''), new.email_confirmed_at is not null)
  on conflict (provider, subject) do update
    set email = excluded.email, email_verified = excluded.email_verified;
  return new;
end;
$$;
revoke all on function public.sync_email_account() from public, anon, authenticated;
create trigger sync_email_account after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_email_account();

create function public.consume_auth_attempt(bucket_key text, max_attempts integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare total integer;
begin
  delete from public.auth_attempts where window_start < now() - interval '1 day';
  insert into public.auth_attempts(key, attempts, window_start) values (bucket_key, 1, now())
  on conflict (key) do update set
    attempts = case when public.auth_attempts.window_start < now() - interval '15 minutes' then 1 else public.auth_attempts.attempts + 1 end,
    window_start = case when public.auth_attempts.window_start < now() - interval '15 minutes' then now() else public.auth_attempts.window_start end
  returning attempts into total;
  return total <= max_attempts;
end;
$$;
revoke all on function public.consume_auth_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.consume_auth_attempt(text, integer) to service_role;

commit;
