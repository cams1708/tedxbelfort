-- ============================================================================
-- Finance module expansion, part 1/3: schema.
-- Adds: budget sub-categories, revenue certainty tiers, invoice document
-- types (quote/purchase_order/invoice/credit_note) with auto-numbering,
-- multi-payment invoice tracking, and a subsidies module.
-- ============================================================================

create type subsidy_status as enum ('requested', 'granted', 'partially_received', 'received', 'declined');

-- ----------------------------------------------------------------------------
-- Budget sub-categories: one level of nesting only, kind inherited from the
-- parent, enforced by trigger (a plain self-FK alone can't express either
-- constraint).
-- ----------------------------------------------------------------------------
alter table budget_categories add column parent_category_id uuid references budget_categories (id) on delete set null;
create index budget_categories_parent_idx on budget_categories (parent_category_id);

create or replace function enforce_budget_category_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent budget_categories%rowtype;
begin
  if new.parent_category_id is null then
    return new;
  end if;

  select * into v_parent from budget_categories where id = new.parent_category_id;

  if v_parent.id is null then
    raise exception 'Catégorie parente introuvable';
  end if;

  if v_parent.parent_category_id is not null then
    raise exception 'Une sous-catégorie ne peut pas elle-même avoir une sous-catégorie (un seul niveau autorisé)';
  end if;

  if v_parent.kind is distinct from new.kind then
    raise exception 'Une sous-catégorie doit avoir le même type (recette/dépense) que sa catégorie parente';
  end if;

  return new;
end;
$$;

create trigger budget_categories_enforce_hierarchy
  before insert or update on budget_categories
  for each row execute function enforce_budget_category_hierarchy();

-- Replace the flat unique(event_id, name, kind) with two partial unique
-- indexes: top-level names unique among themselves, sub-category names
-- unique within their specific parent (NULL doesn't self-compare in SQL, so
-- a single constraint can't express "unique unless it's a NULL parent").
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'budget_categories'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) ilike '%(event_id, name, kind)%';
  if v_conname is not null then
    execute format('alter table budget_categories drop constraint %I', v_conname);
  end if;
end $$;

create unique index budget_categories_top_level_unique
  on budget_categories (event_id, name, kind)
  where parent_category_id is null;

create unique index budget_categories_sub_unique
  on budget_categories (event_id, parent_category_id, name, kind)
  where parent_category_id is not null;

-- ----------------------------------------------------------------------------
-- Revenue certainty tiers (certain / probable / potential). Meaningful only
-- for type='revenue' rows; left at its default for expenses.
-- ----------------------------------------------------------------------------
alter table financial_transactions add column certainty text not null default 'certain'
  check (certainty in ('certain', 'probable', 'potential'));

-- ----------------------------------------------------------------------------
-- Invoice document types. Quotes/purchase orders/invoices/credit notes all
-- live in the existing `invoices` table (reuses RLS, permissions, storage
-- attachment, soft-delete, activity log) instead of four parallel tables.
-- ----------------------------------------------------------------------------
alter table invoices add column document_type text not null default 'invoice'
  check (document_type in ('quote', 'purchase_order', 'invoice', 'credit_note'));
create index invoices_document_type_idx on invoices (event_id, document_type);

-- ----------------------------------------------------------------------------
-- Auto-numbering: one counter per (event, document_type, year).
-- ----------------------------------------------------------------------------
create table document_number_sequences (
  event_id uuid not null references events (id) on delete cascade,
  document_type text not null check (document_type in ('quote', 'purchase_order', 'invoice', 'credit_note')),
  year integer not null,
  last_number integer not null default 0,
  primary key (event_id, document_type, year)
);

-- No policies: this counter must only ever move through next_document_number()
-- below, never via a direct client write.
alter table document_number_sequences enable row level security;

create or replace function next_document_number(p_event_id uuid, p_document_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_seq integer;
  v_prefix text;
begin
  insert into document_number_sequences (event_id, document_type, year, last_number)
  values (p_event_id, p_document_type, v_year, 1)
  on conflict (event_id, document_type, year)
  do update set last_number = document_number_sequences.last_number + 1
  returning last_number into v_seq;

  v_prefix := case p_document_type
    when 'quote' then 'DEV'
    when 'purchase_order' then 'BC'
    when 'invoice' then 'FAC'
    when 'credit_note' then 'AV'
    else 'DOC'
  end;

  return v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

create or replace function assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.number is null or btrim(new.number) = '' then
    new.number := next_document_number(new.event_id, new.document_type);
  end if;
  return new;
end;
$$;

create trigger invoices_assign_number before insert on invoices
  for each row execute function assign_invoice_number();

-- Backfill: seed the counter from the existing demo invoices (all
-- document_type='invoice' at this point) so numbering continues from
-- wherever it left off instead of restarting at 1.
insert into document_number_sequences (event_id, document_type, year, last_number)
select
  i.event_id,
  i.document_type,
  extract(year from i.issue_date)::integer as year,
  max(coalesce((regexp_match(i.number, '-(\d+)$'))[1]::integer, 0)) as last_number
from invoices i
where i.deleted_at is null
group by i.event_id, i.document_type, extract(year from i.issue_date)::integer
on conflict (event_id, document_type, year)
do update set last_number = greatest(document_number_sequences.last_number, excluded.last_number);

-- ----------------------------------------------------------------------------
-- Invoice → budget sync, updated for document_type semantics.
-- ----------------------------------------------------------------------------
create or replace function sync_invoice_financial_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type transaction_type;
  v_tva_rate numeric;
  v_tx_status transaction_status;
  v_sign integer;
  v_title_prefix text;
begin
  -- Quotes and purchase orders are pipeline/informational only. A PO isn't
  -- linked to the real invoice that eventually supersedes it, so syncing it
  -- would double-count the same expense once that invoice lands.
  if new.document_type in ('quote', 'purchase_order') then
    delete from financial_transactions where invoice_id = new.id;
    return new;
  end if;

  if new.status in ('draft', 'cancelled') or new.deleted_at is not null then
    delete from financial_transactions where invoice_id = new.id;
    return new;
  end if;

  v_type := case when new.type = 'sent_to_partner' then 'revenue' else 'expense' end;
  v_tva_rate := case when new.amount > 0 then round(new.tva / new.amount * 100, 2) else 0 end;
  v_tx_status := case new.status
    when 'paid' then 'paid'
    when 'overdue' then 'overdue'
    when 'to_send' then 'planned'
    else 'invoiced' -- sent, pending, partially_paid
  end;

  -- A credit note (avoir) reverses a prior invoice's amount in its category.
  v_sign := case when new.document_type = 'credit_note' then -1 else 1 end;
  v_title_prefix := case when new.document_type = 'credit_note' then 'Avoir ' else 'Facture ' end;

  if exists (select 1 from financial_transactions where invoice_id = new.id) then
    update financial_transactions
    set title = v_title_prefix || new.number || ' — ' || new.title,
        type = v_type,
        category_id = new.category_id,
        amount_ht = v_sign * new.amount,
        tva_rate = v_tva_rate,
        amount_ttc = v_sign * (new.amount + new.tva),
        partner_id = new.partner_id,
        supplier_name = new.supplier_name,
        transaction_date = coalesce(new.paid_at, new.due_date, new.issue_date),
        status = v_tx_status,
        receipt_document_id = new.file_document_id
    where invoice_id = new.id;
  else
    insert into financial_transactions (
      event_id, title, type, category_id, amount_ht, tva_rate, amount_ttc,
      partner_id, supplier_name, transaction_date, status, invoice_id, receipt_document_id, created_by, certainty
    ) values (
      new.event_id, v_title_prefix || new.number || ' — ' || new.title, v_type, new.category_id,
      v_sign * new.amount, v_tva_rate, v_sign * (new.amount + new.tva),
      new.partner_id, new.supplier_name, coalesce(new.paid_at, new.due_date, new.issue_date),
      v_tx_status, new.id, new.file_document_id, new.created_by,
      -- An issued/received invoice is treated as a firm commitment regardless
      -- of payment progress — deliberate default, not an oversight.
      'certain'
    );
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Multi-payment tracking. financial_transactions.amount_ttc/status stay
-- useful for the prévu/engagé/facturé classification, but the ONLY source of
-- truth for an exact "paid so far" amount on an invoice-linked row is
-- invoice_payments — never the synced financial_transactions row (which
-- always carries the full invoice amount, not the partially-paid portion).
-- ----------------------------------------------------------------------------
create table invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_date date not null,
  payment_method payment_method,
  reference text,
  notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index invoice_payments_invoice_idx on invoice_payments (invoice_id);

alter table invoice_payments enable row level security;

create policy invoice_payments_select on invoice_payments for select using (
  exists (
    select 1 from invoices i where i.id = invoice_payments.invoice_id
    and has_permission(auth.uid(), i.event_id, 'invoices', 'view')
  )
);
create policy invoice_payments_insert on invoice_payments for insert with check (
  exists (
    select 1 from invoices i where i.id = invoice_payments.invoice_id
    and has_permission(auth.uid(), i.event_id, 'invoices', 'edit')
  )
);
create policy invoice_payments_update on invoice_payments for update using (
  exists (
    select 1 from invoices i where i.id = invoice_payments.invoice_id
    and has_permission(auth.uid(), i.event_id, 'invoices', 'edit')
  )
) with check (
  exists (
    select 1 from invoices i where i.id = invoice_payments.invoice_id
    and has_permission(auth.uid(), i.event_id, 'invoices', 'edit')
  )
);
create policy invoice_payments_delete on invoice_payments for delete using (
  exists (
    select 1 from invoices i where i.id = invoice_payments.invoice_id
    and has_permission(auth.uid(), i.event_id, 'invoices', 'delete')
  )
);

create or replace function recompute_invoice_status_from_payments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_due numeric;
  v_paid numeric;
  v_last_payment_date date;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select amount + tva into v_due from invoices where id = v_invoice_id;

  select coalesce(sum(amount), 0), max(payment_date)
    into v_paid, v_last_payment_date
  from invoice_payments where invoice_id = v_invoice_id;

  if v_paid <= 0 then
    return coalesce(new, old);
  end if;

  if v_paid >= v_due then
    update invoices set status = 'paid', paid_at = coalesce(v_last_payment_date, paid_at)
    where id = v_invoice_id and document_type in ('invoice', 'credit_note') and status not in ('draft', 'cancelled');
  else
    update invoices set status = 'partially_paid'
    where id = v_invoice_id and document_type in ('invoice', 'credit_note') and status not in ('draft', 'cancelled');
  end if;

  return coalesce(new, old);
end;
$$;

create trigger invoice_payments_recompute_status
  after insert or update or delete on invoice_payments
  for each row execute function recompute_invoice_status_from_payments();

-- View: the correct "paid so far" / "remaining" amount for any invoice,
-- derived from invoice_payments. RLS on the underlying tables still applies
-- to whoever queries this view (Postgres evaluates row security against the
-- querying role, not the view owner).
create view invoice_effective_amounts as
select
  i.id as invoice_id,
  i.amount + i.tva as total_due,
  least(coalesce(p.total_paid, 0), i.amount + i.tva) as total_paid,
  greatest(i.amount + i.tva - coalesce(p.total_paid, 0), 0) as remaining
from invoices i
left join (
  select invoice_id, sum(amount) as total_paid
  from invoice_payments
  group by invoice_id
) p on p.invoice_id = i.id;

-- ----------------------------------------------------------------------------
-- Subsidies (subventions) — requested / granted / received, "remaining"
-- computed at display time (amount_granted - amount_received).
-- ----------------------------------------------------------------------------
create table subsidies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  grantor text,
  amount_requested numeric(12, 2),
  amount_granted numeric(12, 2),
  amount_received numeric(12, 2) not null default 0,
  status subsidy_status not null default 'requested',
  notes text,
  document_id uuid references documents (id) on delete set null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index subsidies_event_idx on subsidies (event_id) where deleted_at is null;

create trigger subsidies_set_updated_at
  before update on subsidies
  for each row execute function set_updated_at();

create trigger subsidies_enforce_delete before update on subsidies
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('subsidies');

create trigger subsidies_log_activity after insert or update or delete on subsidies
  for each row execute function log_activity('subsidies');

alter table subsidies enable row level security;

create policy subsidies_select on subsidies for select using (
  deleted_at is null and has_permission(auth.uid(), event_id, 'subsidies', 'view')
);
create policy subsidies_insert on subsidies for insert with check (
  has_permission(auth.uid(), event_id, 'subsidies', 'create')
);
create policy subsidies_update on subsidies for update using (
  has_permission(auth.uid(), event_id, 'subsidies', 'edit')
) with check (has_permission(auth.uid(), event_id, 'subsidies', 'edit'));
