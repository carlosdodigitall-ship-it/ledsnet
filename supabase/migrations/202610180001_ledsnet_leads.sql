-- LedsNet: armazenamento de leads coletados pelo worker de scraping.
-- A autenticação atual do app usa Firebase UID; user_id é texto intencionalmente.
-- O acesso é feito somente pelo backend/worker com SUPABASE_SERVICE_ROLE_KEY.
create extension if not exists pgcrypto;

create table if not exists public.ledsnet_leads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  place_id text not null,
  name text not null,
  address text,
  phone text,
  website text,
  emails text[] not null default '{}',
  rating numeric(3,2),
  review_count integer,
  category text,
  source text not null default 'google_maps_scraper',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ledsnet_leads_user_place_unique unique (user_id, place_id)
);

create index if not exists ledsnet_leads_user_created_idx
  on public.ledsnet_leads (user_id, created_at desc);
create index if not exists ledsnet_leads_user_category_idx
  on public.ledsnet_leads (user_id, category);
create index if not exists ledsnet_leads_emails_gin_idx
  on public.ledsnet_leads using gin (emails);

alter table public.ledsnet_leads enable row level security;
revoke all on table public.ledsnet_leads from anon, authenticated;
grant all on table public.ledsnet_leads to service_role;

-- Não crie policy para anon/authenticated: o Firebase JWT do app não é um JWT
-- do Supabase Auth. O backend verifica o Firebase ID token e usa service_role
-- exclusivamente no servidor/worker. Nunca exponha essa chave no navegador.
