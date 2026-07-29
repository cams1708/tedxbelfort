-- profiles: 1:1 extension of auth.users
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  is_super_admin boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Creates a profile row whenever a new auth user is created.
-- The very first account on the platform is automatically super_admin.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from profiles) into is_first;

  insert into profiles (id, full_name, is_super_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    is_first
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Supabase Auth updates auth.users.last_sign_in_at on every sign-in;
-- mirror it onto profiles so the app can display "last seen" without
-- ever querying the auth schema directly from the client.
create or replace function handle_user_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update profiles set last_sign_in_at = new.last_sign_in_at where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_sign_in
  after update of last_sign_in_at on auth.users
  for each row execute function handle_user_sign_in();

-- events: the multi-tenant root entity
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  theme text,
  description text,
  event_date date,
  location text,
  status event_status not null default 'planning',
  logo_url text,
  color_primary text,
  color_secondary text,
  sponsoring_goal numeric(12, 2),
  budget_forecast numeric(12, 2),
  currency text not null default 'EUR',
  billing_info jsonb not null default '{}'::jsonb,
  contact_info jsonb not null default '{}'::jsonb,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

-- Bank account details are split out from events (unlike billing_info, which
-- is just invoicing/company info shown in normal settings) so RLS can gate
-- them behind the dedicated `budget.view_bank_details` sensitive permission.
create table event_bank_details (
  event_id uuid primary key references events (id) on delete cascade,
  bank_name text,
  iban text,
  bic text,
  notes text,
  updated_at timestamptz not null default now()
);

create trigger event_bank_details_set_updated_at
  before update on event_bank_details
  for each row execute function set_updated_at();
