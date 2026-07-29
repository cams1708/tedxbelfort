-- roles: event-scoped, except system templates (event_id null) seeded once
-- and cloned per event on creation.
create table roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_system boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, slug)
);

create trigger roles_set_updated_at
  before update on roles
  for each row execute function set_updated_at();

-- permissions: static catalog of module/action pairs and sensitive-data flags.
-- module/action cover the module x action matrix; sensitive permissions
-- reuse module + a dedicated action name (see 0012 seed for the full list).
create table permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  key text not null unique,
  is_sensitive boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create index permissions_module_idx on permissions (module);

-- role_permissions: what a role can do, and at what record-visibility scope.
create table role_permissions (
  role_id uuid not null references roles (id) on delete cascade,
  permission_id uuid not null references permissions (id) on delete cascade,
  allowed boolean not null default true,
  scope permission_scope not null default 'all',
  primary key (role_id, permission_id)
);

-- event_members: a user's membership + role within one event.
create table event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role_id uuid not null references roles (id),
  pole team_pole,
  status member_status not null default 'active',
  invited_by uuid references profiles (id),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create trigger event_members_set_updated_at
  before update on event_members
  for each row execute function set_updated_at();

create index event_members_user_idx on event_members (user_id);
create index event_members_event_idx on event_members (event_id);

-- user_permission_overrides: individual exceptions on top of the role,
-- optionally scoped to one specific resource and/or time-limited.
create table user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  permission_id uuid not null references permissions (id) on delete cascade,
  allowed boolean not null default true,
  scope permission_scope,
  resource_type text,
  resource_id uuid,
  granted_by uuid references profiles (id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_permission_overrides_user_idx on user_permission_overrides (event_id, user_id);
create index user_permission_overrides_resource_idx on user_permission_overrides (resource_type, resource_id);

-- access_requests: "Demander l'accès" flow.
create table access_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  resource_type text not null,
  resource_id uuid,
  permission_requested text not null,
  reason text,
  status access_request_status not null default 'pending',
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index access_requests_event_idx on access_requests (event_id, status);
