create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.monthly_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  income_cents integer not null check (income_cents >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, month_key)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount_cents integer not null check (amount_cents > 0),
  spent_where text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  split_count integer not null default 1 check (split_count >= 1 and split_count <= 50),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expense_split_people (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete restrict,
  primary key (expense_id, person_id)
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  recurrence text not null check (recurrence in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  amount_cents integer not null check (amount_cents > 0),
  spent_where text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  split_count integer not null default 1 check (split_count >= 1 and split_count <= 50),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.recurring_split_people (
  recurring_expense_id uuid not null references public.recurring_expenses(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete restrict,
  primary key (recurring_expense_id, person_id)
);

create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_payment_methods_user_id on public.payment_methods(user_id);
create index if not exists idx_people_user_id on public.people(user_id);
create index if not exists idx_monthly_incomes_user_month on public.monthly_incomes(user_id, month_key);
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_recurring_expenses_user_start on public.recurring_expenses(user_id, start_date);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

create trigger monthly_incomes_set_updated_at
before update on public.monthly_incomes
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  username_seed text;
  generated_username text;
begin
  base_name := coalesce(new.raw_user_meta_data ->> 'full_name', 'User');
  username_seed := coalesce(new.raw_user_meta_data ->> 'username_seed', base_name);
  generated_username := regexp_replace(lower(username_seed), '[^a-z0-9]+', '-', 'g');
  generated_username := trim(both '-' from generated_username);
  generated_username := left(coalesce(nullif(generated_username, ''), 'user'), 20) || '-' || substring(new.id::text from 1 for 6);

  insert into public.profiles (id, full_name, username)
  values (new.id, base_name, generated_username)
  on conflict (id) do update
  set full_name = excluded.full_name,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.people enable row level security;
alter table public.monthly_incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_split_people enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.recurring_split_people enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check ((select auth.uid()) = id);

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "payment_methods_all_own" on public.payment_methods;
create policy "payment_methods_all_own" on public.payment_methods
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "people_all_own" on public.people;
create policy "people_all_own" on public.people
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_incomes_all_own" on public.monthly_incomes;
create policy "monthly_incomes_all_own" on public.monthly_incomes
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "expense_split_people_all_own" on public.expense_split_people;
create policy "expense_split_people_all_own" on public.expense_split_people
for all using (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_id
      and e.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.expenses e
    where e.id = expense_id
      and e.user_id = (select auth.uid())
  )
);

drop policy if exists "recurring_expenses_all_own" on public.recurring_expenses;
create policy "recurring_expenses_all_own" on public.recurring_expenses
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "recurring_split_people_all_own" on public.recurring_split_people;
create policy "recurring_split_people_all_own" on public.recurring_split_people
for all using (
  exists (
    select 1
    from public.recurring_expenses e
    where e.id = recurring_expense_id
      and e.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.recurring_expenses e
    where e.id = recurring_expense_id
      and e.user_id = (select auth.uid())
  )
);
