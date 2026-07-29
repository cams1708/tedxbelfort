-- financial_transactions never had a DELETE policy (the original design
-- intent was "cancel via status", not delete) — but users need a real way
-- to remove mis-entered demo/test movements, so add one gated by the
-- existing `budget.delete` permission (already in the catalog, just never
-- wired to a policy).
create policy financial_transactions_delete on financial_transactions for delete using (
  has_permission(auth.uid(), event_id, 'budget', 'delete')
);

-- Archiving an invoice (soft delete via deleted_at) only changes deleted_at,
-- not status — the sync trigger below now also treats a deleted invoice as
-- "no longer paid", so its auto-generated budget-réel entry is removed too.
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
  if new.status = 'paid' and new.deleted_at is null then
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
