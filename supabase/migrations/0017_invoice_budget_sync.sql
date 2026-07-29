-- Link invoices to a budget category, and auto-generate/maintain the
-- matching "budget réel" (financial_transactions) entry whenever an invoice
-- is marked paid — so the Trésorier never has to enter the same movement
-- twice. Money owed BY the org (received_from_supplier) becomes an expense;
-- money owed TO the org by partners (sent_to_partner) becomes a revenue.
alter table invoices add column category_id uuid references budget_categories (id);

-- The demo transaction below is superseded by the auto-generated one linked
-- to FAC-2026-001 once the backfill at the end of this migration runs.
delete from financial_transactions
where title = 'Acompte partenariat Fondation Comtoise' and invoice_id is null;

create or replace function sync_invoice_financial_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type transaction_type;
  v_tva_rate numeric;
begin
  if new.status = 'paid' then
    v_type := case when new.type = 'sent_to_partner' then 'revenue' else 'expense' end;
    v_tva_rate := case when new.amount > 0 then round(new.tva / new.amount * 100, 2) else 0 end;

    if exists (select 1 from financial_transactions where invoice_id = new.id) then
      update financial_transactions
      set title = 'Facture ' || new.number || ' — ' || new.title,
          type = v_type,
          category_id = new.category_id,
          amount_ht = new.amount,
          tva_rate = v_tva_rate,
          amount_ttc = new.amount + new.tva,
          partner_id = new.partner_id,
          supplier_name = new.supplier_name,
          transaction_date = coalesce(new.paid_at, new.issue_date),
          status = 'paid',
          receipt_document_id = new.file_document_id
      where invoice_id = new.id;
    else
      insert into financial_transactions (
        event_id, title, type, category_id, amount_ht, tva_rate, amount_ttc,
        partner_id, supplier_name, transaction_date, status, invoice_id, receipt_document_id, created_by
      ) values (
        new.event_id, 'Facture ' || new.number || ' — ' || new.title, v_type, new.category_id,
        new.amount, v_tva_rate, new.amount + new.tva,
        new.partner_id, new.supplier_name, coalesce(new.paid_at, new.issue_date), 'paid', new.id, new.file_document_id, new.created_by
      );
    end if;
  else
    delete from financial_transactions where invoice_id = new.id;
  end if;

  return new;
end;
$$;

create trigger invoices_sync_financial_transaction
  after insert or update on invoices
  for each row execute function sync_invoice_financial_transaction();

-- Backfill: assign categories to the existing demo invoices, then re-touch
-- them so the trigger above runs retroactively (only 'paid' invoices
-- actually create a linked transaction).
do $$
declare
  v_event_id uuid;
  v_cat_sponsoring uuid;
  v_cat_salle uuid;
  v_cat_communication uuid;
begin
  select id into v_event_id from events where slug = 'tedx-belfort-2026';
  select id into v_cat_sponsoring from budget_categories where event_id = v_event_id and name = 'Sponsoring';
  select id into v_cat_salle from budget_categories where event_id = v_event_id and name = 'Location de salle';
  select id into v_cat_communication from budget_categories where event_id = v_event_id and name = 'Communication';

  update invoices set category_id = v_cat_sponsoring where event_id = v_event_id and number = 'FAC-2026-001';
  update invoices set category_id = v_cat_salle where event_id = v_event_id and number = 'FAC-2026-002';
  update invoices set category_id = v_cat_communication where event_id = v_event_id and number = 'FAC-2026-003';

  update invoices set status = status where event_id = v_event_id;
end $$;
