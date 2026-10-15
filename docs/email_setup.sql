-- Run once in Supabase SQL Editor before enabling report interest email.
-- This stores only an email address and consent metadata, never lab values.
create extension if not exists pgcrypto;

create table if not exists public.report_interest (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null check (locale in ('es', 'en', 'pt')),
  privacy_notice_version text not null,
  consented_at timestamptz not null,
  expires_at timestamptz not null,
  user_email_sent_at timestamptz,
  owner_email_sent_at timestamptz
);

create index if not exists report_interest_expires_idx
  on public.report_interest (expires_at);

alter table public.report_interest enable row level security;
revoke all on public.report_interest from public, anon, authenticated;
grant select, insert, update, delete on public.report_interest to service_role;

-- Check: RLS must be true. No policy grants browser roles access.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'report_interest';
