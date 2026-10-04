create table transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    type text not null check (type in ('income', 'expense')),
    category text not null,
    amount numeric not null check (amount > 0),
    description text,
    date date not null,
    created_at timestamptz default now()
);

create table budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    category text not null,
    limit_amount numeric not null check (limit_amount > 0),
    month_year text not null,
    unique (user_id, category, month_year)
);

create table badges (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    badge_code text not null,
    earned_at timestamptz default now(),
    unique (user_id, badge_code)
);

alter table transactions enable row level security;
alter table budgets enable row level security;
alter table badges enable row level security;

create policy "own transactions" on transactions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own budgets" on budgets
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own badges" on badges
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
