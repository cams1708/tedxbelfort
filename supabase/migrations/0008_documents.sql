create table documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  category text not null,
  storage_path text not null,
  version integer not null default 1,
  file_size bigint,
  mime_type text,
  author_id uuid references profiles (id),
  partner_id uuid references partners (id) on delete set null,
  speaker_id uuid references speakers (id) on delete set null,
  task_id uuid references tasks (id) on delete set null,
  confidentiality_level document_confidentiality not null default 'team_public',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger documents_set_updated_at
  before update on documents
  for each row execute function set_updated_at();

create index documents_event_idx on documents (event_id) where deleted_at is null;
create index documents_category_idx on documents (event_id, category);
create index documents_partner_idx on documents (partner_id);
create index documents_speaker_idx on documents (speaker_id);

-- Explicit grant list used for the pole_restricted / assigned_only
-- confidentiality levels (in addition to the author and super_admin, who
-- always have access).
create table document_access (
  document_id uuid not null references documents (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  pole team_pole,
  granted_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  check (user_id is not null or pole is not null)
);

create index document_access_document_idx on document_access (document_id);
create index document_access_user_idx on document_access (user_id);

create table document_downloads (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  user_id uuid references profiles (id),
  downloaded_at timestamptz not null default now()
);

create index document_downloads_document_idx on document_downloads (document_id, downloaded_at desc);

-- Now that documents exists, wire up the forward references left dangling
-- by earlier migrations (partner document sends, receipts, invoice files,
-- interaction attachments).
alter table partner_document_sends
  add constraint partner_document_sends_document_fk
  foreign key (document_id) references documents (id) on delete set null;

alter table partner_interactions
  add constraint partner_interactions_attachment_fk
  foreign key (attachment_document_id) references documents (id) on delete set null;

alter table financial_transactions
  add constraint financial_transactions_receipt_fk
  foreign key (receipt_document_id) references documents (id) on delete set null;

alter table invoices
  add constraint invoices_file_fk
  foreign key (file_document_id) references documents (id) on delete set null;
