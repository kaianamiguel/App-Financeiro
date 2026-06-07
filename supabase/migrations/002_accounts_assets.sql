-- accounts: named sources (bank accounts and credit cards)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cartao', 'conta')),
  unique(user_id, name)
);
alter table accounts enable row level security;
create policy "Users can manage own accounts" on accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- add account_name to transactions (nullable for backwards compat)
alter table transactions add column if not exists account_name text;

-- assets: wealth tracking (savings, investments, property, etc.)
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'outro',
  value numeric not null default 0,
  updated_at timestamptz not null default now()
);
alter table assets enable row level security;
create policy "Users can manage own assets" on assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
