create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'manager', 'sales_rep', 'viewer');
create type public.lead_status as enum ('new', 'qualified', 'contacted', 'demo_scheduled', 'proposal_sent', 'won', 'lost');
create type public.message_direction as enum ('inbound', 'outbound');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  role public.member_role not null default 'sales_rep',
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  approved_facts jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  external_campaign_id text,
  name text not null,
  platform text not null default 'instagram',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  unique (organization_id, external_campaign_id)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  whatsapp_user_id text not null,
  full_name text,
  company_name text,
  city text,
  role text,
  intent text,
  source text not null default 'instagram',
  status public.lead_status not null default 'new',
  qualification_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, whatsapp_user_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  state text not null default 'welcome',
  is_open boolean not null default true,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  external_message_id text,
  direction public.message_direction not null,
  message_type text not null default 'text',
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, external_message_id)
);

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  segment text not null,
  reasons jsonb not null default '[]'::jsonb,
  recommended_action text,
  created_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  stage public.lead_status not null default 'qualified',
  amount numeric(12,2),
  currency text not null default 'TRY',
  won_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  event_name text not null,
  event_id text not null,
  status text not null default 'pending',
  payload jsonb not null,
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, event_id)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  agent_name text not null,
  input_summary jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  model text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index leads_org_status_idx on public.leads (organization_id, status);
create index leads_org_created_idx on public.leads (organization_id, created_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index lead_scores_lead_created_idx on public.lead_scores (lead_id, created_at desc);
create index conversion_events_status_idx on public.conversion_events (organization_id, status);

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.lead_scores enable row level security;
alter table public.opportunities enable row level security;
alter table public.conversion_events enable row level security;
alter table public.agent_runs enable row level security;
alter table public.audit_logs enable row level security;

create policy "members read own organization" on public.organizations
for select using (id = public.current_organization_id());

create policy "members read own profiles" on public.profiles
for select using (organization_id = public.current_organization_id());

create policy "members manage own products" on public.products
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own campaigns" on public.campaigns
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own leads" on public.leads
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own conversations" on public.conversations
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own messages" on public.messages
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own scores" on public.lead_scores
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members manage own opportunities" on public.opportunities
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "members read own conversions" on public.conversion_events
for select using (organization_id = public.current_organization_id());

create policy "members read own agent runs" on public.agent_runs
for select using (organization_id = public.current_organization_id());

create policy "members read own audit logs" on public.audit_logs
for select using (organization_id = public.current_organization_id());
