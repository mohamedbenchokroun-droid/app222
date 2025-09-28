-- clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null,
  original_amount numeric not null,
  discount_percentage numeric,
  status text not null default 'new',
  commercial_id uuid references public.commercials(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- commercials table
create table if not exists public.commercials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- tags table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  text text not null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- join table client_tags
create table if not exists public.client_tags (
  client_id uuid not null references public.clients(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (client_id, tag_id)
);

-- Simple permissive RLS for demo (enable and allow anon)
alter table public.clients enable row level security;
alter table public.commercials enable row level security;
alter table public.tags enable row level security;
alter table public.comments enable row level security;
alter table public.client_tags enable row level security;

create policy "Allow read for all" on public.clients for select using (true);
create policy "Allow write for all" on public.clients for insert with check (true);
create policy "Allow update for all" on public.clients for update using (true);

create policy "Allow read for all" on public.commercials for select using (true);
create policy "Allow write for all" on public.commercials for insert with check (true);

create policy "Allow read for all" on public.tags for select using (true);
create policy "Allow write for all" on public.tags for insert with check (true);
create policy "Allow update for all" on public.tags for update using (true);

create policy "Allow read for all" on public.comments for select using (true);
create policy "Allow write for all" on public.comments for insert with check (true);
create policy "Allow update for all" on public.comments for update using (true);

create policy "Allow read for all" on public.client_tags for select using (true);
create policy "Allow write for all" on public.client_tags for insert with check (true);




