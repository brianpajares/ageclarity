-- Supabase migration: no grants to anon/authenticated except own public unrelated objects.
create extension if not exists pgcrypto;
create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(), email text not null, locale text not null check(locale in ('es','en','pt')),
 state text not null default 'received', source text, created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '90 days'));
create table if not exists public.consent_records (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade,
 privacy boolean not null check(privacy), health_data boolean not null check(health_data), marketing boolean not null default false,
 policy_version text not null, consented_at timestamptz not null default now());
create table if not exists public.calculations (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade,
 model_version text not null, input_ciphertext bytea, output_ciphertext bytea,
 purge_after timestamptz not null default(now()+interval '30 days'), created_at timestamptz not null default now());
create table if not exists public.email_deliveries (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade,
 template text not null, idempotency_key text not null unique, provider_id text, state text not null default 'queued',
 sent_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.audit_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid, operation text not null, subject_id uuid,
 details jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now());
create table if not exists public.webhook_events (
 event_id text primary key, provider text not null, processed_at timestamptz not null default now());
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
-- Explicit RLS even for server writes. Use server-only service-role and encrypt health payload in app before DB.
do $$ declare t text; begin foreach t in array array['leads','consent_records','calculations','email_deliveries','audit_log','webhook_events','admin_users'] loop
 execute format('alter table public.%I enable row level security', t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop; end $$;
-- Authenticated admin reads via controlled SECURITY DEFINER RPC (implement with search_path hardened)
-- or backend using service-role + explicit admin_users JWT check. Never expose service key to browser.
create index if not exists leads_created_idx on public.leads(created_at desc);
create index if not exists calculations_purge_idx on public.calculations(purge_after);
