create table partners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  company_name text not null,
  logo_url text,
  sector text,
  website text,
  address text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  source text,
  owner_id uuid references profiles (id),
  priority partner_priority not null default 'medium',
  status partner_status not null default 'to_research',
  contribution_type contribution_type,
  next_action text,
  next_followup_date date,
  notes text,
  counterparts_proposed text,
  counterparts_validated text,
  signed_at date,
  tags text[] not null default '{}',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger partners_set_updated_at
  before update on partners
  for each row execute function set_updated_at();

create index partners_event_idx on partners (event_id) where deleted_at is null;
create index partners_owner_idx on partners (owner_id);
create index partners_status_idx on partners (event_id, status);

-- Sensitive amounts and confidential notes are split into their own tables,
-- each independently gated in RLS, so a user can hold one permission
-- without the other (per spec: seeing the requested/obtained amount is a
-- distinct grant from seeing confidential internal notes).
create table partner_amounts (
  partner_id uuid primary key references partners (id) on delete cascade,
  amount_expected numeric(12, 2),
  amount_proposed numeric(12, 2),
  amount_confirmed numeric(12, 2),
  updated_at timestamptz not null default now()
);

create trigger partner_amounts_set_updated_at
  before update on partner_amounts
  for each row execute function set_updated_at();

create table partner_confidential_notes (
  partner_id uuid primary key references partners (id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);

create trigger partner_confidential_notes_set_updated_at
  before update on partner_confidential_notes
  for each row execute function set_updated_at();

create table partner_contacts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index partner_contacts_partner_idx on partner_contacts (partner_id);

create table partner_interactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  partner_id uuid not null references partners (id) on delete cascade,
  type interaction_type not null,
  summary text not null,
  user_id uuid references profiles (id),
  attachment_document_id uuid,
  next_action text,
  next_followup_date date,
  created_at timestamptz not null default now()
);

create index partner_interactions_partner_idx on partner_interactions (partner_id, created_at desc);

create table partner_followups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  partner_id uuid not null references partners (id) on delete cascade,
  due_date date not null,
  status followup_status not null default 'upcoming',
  note text,
  assigned_to uuid references profiles (id),
  completed_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index partner_followups_event_idx on partner_followups (event_id, due_date);
create index partner_followups_assignee_idx on partner_followups (assigned_to);

create table partner_document_sends (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  partner_id uuid not null references partners (id) on delete cascade,
  document_id uuid,
  document_type text not null,
  recipient_email text not null,
  subject text not null,
  message text,
  status document_send_status not null default 'draft',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger partner_document_sends_set_updated_at
  before update on partner_document_sends
  for each row execute function set_updated_at();

create index partner_document_sends_partner_idx on partner_document_sends (partner_id);
