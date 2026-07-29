create table budget_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  kind transaction_type not null,
  forecast_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, name, kind)
);

create index budget_categories_event_idx on budget_categories (event_id);

-- The entire finance module is gated behind the `budget`/`invoices` module
-- permissions (checked in RLS), not just a column flag: these tables never
-- return a row to a user without explicit finance access.
create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  type transaction_type not null,
  category_id uuid references budget_categories (id),
  amount_ht numeric(12, 2) not null,
  tva_rate numeric(5, 2) not null default 0,
  amount_ttc numeric(12, 2) not null,
  partner_id uuid references partners (id),
  supplier_name text,
  transaction_date date not null,
  due_date date,
  status transaction_status not null default 'planned',
  payment_method payment_method,
  invoice_id uuid,
  receipt_document_id uuid,
  confidential_comment text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger financial_transactions_set_updated_at
  before update on financial_transactions
  for each row execute function set_updated_at();

create index financial_transactions_event_idx on financial_transactions (event_id);
create index financial_transactions_category_idx on financial_transactions (category_id);
create index financial_transactions_status_idx on financial_transactions (event_id, status);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  number text not null,
  title text not null,
  type invoice_type not null,
  partner_id uuid references partners (id),
  supplier_name text,
  amount numeric(12, 2) not null,
  tva numeric(12, 2) not null default 0,
  issue_date date not null,
  due_date date,
  status invoice_status not null default 'draft',
  paid_at date,
  file_document_id uuid,
  confidential_notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (event_id, number)
);

create trigger invoices_set_updated_at
  before update on invoices
  for each row execute function set_updated_at();

create index invoices_event_idx on invoices (event_id) where deleted_at is null;
create index invoices_status_idx on invoices (event_id, status);

alter table financial_transactions
  add constraint financial_transactions_invoice_fk
  foreign key (invoice_id) references invoices (id) on delete set null;
