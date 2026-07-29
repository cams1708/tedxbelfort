create table team_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid references profiles (id),
  first_name text not null,
  last_name text not null,
  photo_url text,
  role_label text,
  pole team_pole not null,
  status member_status not null default 'active',
  arrival_date date,
  availability text,
  workload_notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger team_members_set_updated_at
  before update on team_members
  for each row execute function set_updated_at();

create index team_members_event_idx on team_members (event_id) where deleted_at is null;

-- Personal contact details + confidential admin notes, split out so RLS can
-- gate them behind `team.view_personal_data` and withhold the whole row
-- (not just mask columns) from users without that permission.
create table team_member_private (
  team_member_id uuid primary key references team_members (id) on delete cascade,
  email text,
  phone text,
  admin_confidential_notes text,
  updated_at timestamptz not null default now()
);

create trigger team_member_private_set_updated_at
  before update on team_member_private
  for each row execute function set_updated_at();
create index team_members_pole_idx on team_members (event_id, pole);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text,
  module_ref task_module_ref not null default 'general',
  partner_id uuid references partners (id) on delete set null,
  speaker_id uuid references speakers (id) on delete set null,
  owner_id uuid references profiles (id),
  priority task_priority not null default 'normal',
  status task_status not null default 'todo',
  due_date date,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create index tasks_event_idx on tasks (event_id) where deleted_at is null;
create index tasks_owner_idx on tasks (owner_id);
create index tasks_status_idx on tasks (event_id, status);
create index tasks_due_date_idx on tasks (event_id, due_date);

create table task_assignees (
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (task_id, user_id)
);

create index task_assignees_user_idx on task_assignees (user_id);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position integer not null default 0
);

create index task_checklist_items_task_idx on task_checklist_items (task_id, position);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index task_comments_task_idx on task_comments (task_id, created_at);
