create table speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  photo_url text,
  city text,
  profession text,
  company text,
  bio text,
  social_links jsonb not null default '{}'::jsonb,
  proposed_topic text,
  talk_title text,
  talk_summary text,
  talk_angle text,
  duration_minutes integer,
  owner_id uuid references profiles (id),
  status speaker_status not null default 'considered',
  availability text,
  constraints text,
  technical_needs text,
  accessibility_needs text,
  transport text,
  accommodation text,
  notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger speakers_set_updated_at
  before update on speakers
  for each row execute function set_updated_at();

create index speakers_event_idx on speakers (event_id) where deleted_at is null;
create index speakers_owner_idx on speakers (owner_id);
create index speakers_status_idx on speakers (event_id, status);

-- Personal contact details + confidential notes, split out so RLS can
-- gate them behind `speakers.view_personal_info`.
create table speaker_private (
  speaker_id uuid primary key references speakers (id) on delete cascade,
  email text,
  phone text,
  confidential_notes text,
  updated_at timestamptz not null default now()
);

create trigger speaker_private_set_updated_at
  before update on speaker_private
  for each row execute function set_updated_at();

create table speaker_checklist_items (
  id uuid primary key default gen_random_uuid(),
  speaker_id uuid not null references speakers (id) on delete cascade,
  item_key speaker_checklist_key not null,
  is_done boolean not null default false,
  done_at timestamptz,
  done_by uuid references profiles (id),
  unique (speaker_id, item_key)
);

create index speaker_checklist_items_speaker_idx on speaker_checklist_items (speaker_id);

create table speaker_timeline (
  id uuid primary key default gen_random_uuid(),
  speaker_id uuid not null references speakers (id) on delete cascade,
  event_type text not null,
  note text,
  user_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index speaker_timeline_speaker_idx on speaker_timeline (speaker_id, created_at desc);
