-- OFT Template Maker — Track B tables
-- Dataverse analogs are noted on each table.
-- Paste into Supabase SQL editor and run. Sample campaigns come from src/data/seed.ts.

create extension if not exists "pgcrypto";

-- Dataverse: Campaign
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  master_type text not null check (master_type in ('newsletter', 'custom2', 'hackathon', 'event_invite', 'monthly_update', 'weekly_snapshot')),
  name text not null,
  subject text not null default '',
  region text not null default '',
  kicker text not null default '',
  title text not null default '',
  greeting text not null default '',
  intro text not null default '',
  event_name text not null default '',
  event_url text not null default '',
  event_date_label text not null default '',
  event_time_label text not null default '',
  language_note text not null default '',
  overview_body text not null default '',
  action_heading text not null default '',
  action_body text not null default '',
  register_label text not null default '',
  register_url text not null default '',
  secondary_cta_label text not null default '',
  secondary_cta_url text not null default '',
  signoff_thanks text not null default '',
  signer_name text not null default '',
  signer_title text not null default '',
  signer_email text not null default '',
  month_label text not null default '',
  subtitle text not null default '',
  contents_intro text not null default '',
  snapshot_date text not null default '',
  callouts text not null default '',
  banner_image text not null default '',
  section_image text not null default '',
  newsletter text not null default '',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Image slots added later; safe to re-run on an existing database.
alter table public.campaigns add column if not exists banner_image text not null default '';
alter table public.campaigns add column if not exists section_image text not null default '';

-- Newsletter studio (banner, rich text body blocks, footer as JSON); safe to re-run.
alter table public.campaigns add column if not exists newsletter text not null default '';
alter table public.campaigns drop constraint if exists campaigns_master_type_check;
alter table public.campaigns add constraint campaigns_master_type_check
  check (master_type in ('newsletter', 'custom2', 'hackathon', 'event_invite', 'monthly_update', 'weekly_snapshot'));

-- Email language (en, fr): the email's fixed wording and Copilot's writing language; safe to re-run.
alter table public.campaigns add column if not exists language text not null default 'en';

-- Dataverse: AgendaItem
create table if not exists public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  sort_order integer not null default 0,
  text text not null default ''
);

-- Dataverse: SpotlightCard
create table if not exists public.spotlight_cards (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  sort_order integer not null default 0,
  headline text not null default '',
  image_url text not null default '',
  body text not null default '',
  bullets text not null default '',
  cta_label text not null default 'Register now!',
  cta_url text not null default ''
);

-- Dataverse: EventRow
create table if not exists public.event_rows (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  sort_order integer not null default 0,
  section text not null default '',
  title text not null default '',
  title_url text not null default '',
  col_a text not null default '',
  col_b text not null default '',
  col_c text not null default '',
  col_d text not null default '',
  col_e text not null default '',
  col_f text not null default '',
  col_g text not null default '',
  highlight text not null default ''
);

create index if not exists agenda_items_campaign_idx on public.agenda_items (campaign_id, sort_order);
create index if not exists spotlight_cards_campaign_idx on public.spotlight_cards (campaign_id, sort_order);
create index if not exists event_rows_campaign_idx on public.event_rows (campaign_id, section, sort_order);

alter table public.campaigns enable row level security;
alter table public.agenda_items enable row level security;
alter table public.spotlight_cards enable row level security;
alter table public.event_rows enable row level security;

drop policy if exists campaigns_demo on public.campaigns;
drop policy if exists agenda_demo on public.agenda_items;
drop policy if exists spotlight_demo on public.spotlight_cards;
drop policy if exists rows_demo on public.event_rows;

create policy campaigns_demo on public.campaigns for all using (true) with check (true);
create policy agenda_demo on public.agenda_items for all using (true) with check (true);
create policy spotlight_demo on public.spotlight_cards for all using (true) with check (true);
create policy rows_demo on public.event_rows for all using (true) with check (true);
