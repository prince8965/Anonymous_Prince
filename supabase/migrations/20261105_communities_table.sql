-- NearCircle Communities Table Migration
-- Allows participants, organizers, and admins to create public communities
-- File: supabase/migrations/20261105_communities_table.sql

create table if not exists public.communities (
  id text primary key,
  name text not null check (char_length(trim(name)) > 0),
  description text not null,
  category text not null,
  locality_id text not null default 'andheri',
  accent text not null default '#00F2FE',
  member_count integer not null default 1,
  creator_id uuid references auth.users(id) on delete set null,
  creator_role text not null default 'participant',
  creator_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communities enable row level security;

-- Everyone can view all communities
create policy "Communities are viewable by everyone"
  on public.communities for select
  using (true);

-- Authenticated users (participants, organizers, admins) can create communities
create policy "Authenticated users can create communities"
  on public.communities for insert
  with check (auth.uid() is not null);

-- Creator or admin can update their community
create policy "Creator or admin can update their community"
  on public.communities for update
  using (auth.uid() = creator_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

