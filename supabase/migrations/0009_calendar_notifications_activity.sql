create table calendar_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text,
  type calendar_item_type not null,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  partner_id uuid references partners (id) on delete set null,
  speaker_id uuid references speakers (id) on delete set null,
  task_id uuid references tasks (id) on delete set null,
  owner_id uuid references profiles (id),
  visibility calendar_visibility not null default 'all',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger calendar_items_set_updated_at
  before update on calendar_items
  for each row execute function set_updated_at();

create index calendar_items_event_idx on calendar_items (event_id, start_at);
create index calendar_items_owner_idx on calendar_items (owner_id);

create table calendar_item_attendees (
  calendar_item_id uuid not null references calendar_items (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (calendar_item_id, user_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  event_id uuid references events (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_url text,
  related_resource_type text,
  related_resource_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- activity_logs: append-only audit trail. No update/delete policy is ever
-- defined for this table (see RLS migration) — rows are immutable once
-- written, and readable only by super_admin.
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete cascade,
  user_id uuid references profiles (id),
  action activity_action not null,
  module text not null,
  resource_type text,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_event_idx on activity_logs (event_id, created_at desc);
create index activity_logs_resource_idx on activity_logs (resource_type, resource_id);
