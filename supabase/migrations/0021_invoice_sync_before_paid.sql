-- Previously the budget-réel only picked up an invoice once it was marked
-- "Payée" — a "pending"/"sent"/"overdue" invoice had no effect on the
-- budget at all. Per the actual requirement, any invoice that has left
-- draft status is a real commitment and should show up in the budget
-- immediately, with its financial_transactions status reflecting where the
-- invoice actually stands (not always "paid").
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
begin
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
        transaction_date = coalesce(new.paid_at, new.due_date, new.issue_date),
        status = v_tx_status,
        receipt_document_id = new.file_document_id
    where invoice_id = new.id;
  else
    insert into financial_transactions (
      event_id, title, type, category_id, amount_ht, tva_rate, amount_ttc,
      partner_id, supplier_name, transaction_date, status, invoice_id, receipt_document_id, created_by
    ) values (
      new.event_id, 'Facture ' || new.number || ' — ' || new.title, v_type, new.category_id,
      new.amount, v_tva_rate, new.amount + new.tva,
      new.partner_id, new.supplier_name, coalesce(new.paid_at, new.due_date, new.issue_date),
      v_tx_status, new.id, new.file_document_id, new.created_by
    );
  end if;

  return new;
end;
$$;

-- Backfill: sync every existing non-draft, non-cancelled, non-deleted
-- invoice that doesn't already have a linked transaction (created before
-- this fix).
update invoices set status = status where status not in ('draft', 'cancelled') and deleted_at is null;
