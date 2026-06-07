-- Enable UUID extension
create extension if not exists "pgcrypto";

-- transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  raw_title text not null,
  category text not null,
  amount numeric not null,
  source text not null check (source in ('cartao', 'conta')),
  dedup_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_user_dedup_idx on transactions(user_id, dedup_hash);
create index if not exists transactions_date_idx on transactions(user_id, date);

alter table transactions enable row level security;

create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);

-- budgets table
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  unique(user_id, category)
);

alter table budgets enable row level security;

create policy "Users can view own budgets" on budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on budgets for delete using (auth.uid() = user_id);

-- settings table
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_income numeric not null default 7000,
  savings_goal numeric not null default 4500
);

alter table settings enable row level security;

create policy "Users can view own settings" on settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on settings for update using (auth.uid() = user_id);

-- uploads table
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_type text not null check (file_type in ('cartao', 'conta')),
  rows_imported integer not null default 0,
  rows_skipped integer not null default 0,
  created_at timestamptz not null default now()
);

alter table uploads enable row level security;

create policy "Users can view own uploads" on uploads for select using (auth.uid() = user_id);
create policy "Users can insert own uploads" on uploads for insert with check (auth.uid() = user_id);
