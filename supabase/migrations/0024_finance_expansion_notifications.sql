-- ============================================================================
-- Finance module expansion, part 2/3: alerts.
-- Extends generate_due_notifications() with two new blocks: budget overspend
-- per category (rolled up to include sub-categories) and overdue invoices
-- (the existing "due soon" block only ever looks 7 days ahead, never after
-- the due date has actually passed). Same event_members → role_permissions →
-- permissions join style as the existing blocks, for consistency.
--
-- Unlike the existing single-recipient blocks (task.owner_id,
-- followup.assigned_to), these two can match multiple recipients per
-- resource, so the "already notified today" dedup check includes user_id —
-- without it, the first user notified would block every other user from
-- ever being notified for that same resource.
-- ============================================================================
create or replace function generate_due_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tasks due tomorrow, not already notified.
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select t.owner_id, t.event_id, 'task_due_soon', 'Tâche bientôt échue', t.title, '/tasks', 'tasks', t.id
  from tasks t
  where t.deleted_at is null
    and t.owner_id is not null
    and t.status not in ('done', 'cancelled')
    and t.due_date = (current_date + 1)
    and not exists (
      select 1 from notifications n
      where n.related_resource_type = 'tasks' and n.related_resource_id = t.id
        and n.type = 'task_due_soon' and n.created_at::date = current_date
    );

  -- Overdue tasks, reminded once per day.
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select t.owner_id, t.event_id, 'task_overdue', 'Tâche en retard', t.title, '/tasks', 'tasks', t.id
  from tasks t
  where t.deleted_at is null
    and t.owner_id is not null
    and t.status not in ('done', 'cancelled')
    and t.due_date < current_date
    and not exists (
      select 1 from notifications n
      where n.related_resource_type = 'tasks' and n.related_resource_id = t.id
        and n.type = 'task_overdue' and n.created_at::date = current_date
    );

  -- Follow-ups due today or overdue.
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select f.assigned_to, f.event_id, 'followup_due', 'Relance à effectuer', p.company_name, '/followups', 'partner_followups', f.id
  from partner_followups f
  join partners p on p.id = f.partner_id
  where f.assigned_to is not null
    and f.status in ('upcoming', 'due_today', 'overdue')
    and f.due_date <= current_date
    and not exists (
      select 1 from notifications n
      where n.related_resource_type = 'partner_followups' and n.related_resource_id = f.id
        and n.type = 'followup_due' and n.created_at::date = current_date
    );

  -- Invoices due within 7 days.
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select em.user_id, i.event_id, 'invoice_due_soon', 'Facture arrivant à échéance', i.title, '/invoices', 'invoices', i.id
  from invoices i
  join event_members em on em.event_id = i.event_id
  join role_permissions rp on rp.role_id = em.role_id
  join permissions p on p.id = rp.permission_id and p.module = 'invoices' and p.action = 'view' and rp.allowed = true
  where i.deleted_at is null
    and i.status not in ('paid', 'cancelled')
    and i.due_date is not null
    and i.due_date between current_date and current_date + 7
    and not exists (
      select 1 from notifications n
      where n.related_resource_type = 'invoices' and n.related_resource_id = i.id
        and n.type = 'invoice_due_soon' and n.created_at::date = current_date
    );

  -- Invoices already past their due date (the block above never catches
  -- these — it only looks forward up to 7 days).
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select em.user_id, i.event_id, 'invoice_overdue', 'Facture en retard', i.title, '/invoices', 'invoices', i.id
  from invoices i
  join event_members em on em.event_id = i.event_id
  join role_permissions rp on rp.role_id = em.role_id
  join permissions p on p.id = rp.permission_id and p.module = 'invoices' and p.action = 'view' and rp.allowed = true
  where i.deleted_at is null
    and i.document_type in ('invoice', 'credit_note')
    and i.status not in ('paid', 'cancelled', 'draft')
    and i.due_date is not null
    and i.due_date < current_date
    and not exists (
      select 1 from notifications n
      where n.user_id = em.user_id and n.related_resource_type = 'invoices' and n.related_resource_id = i.id
        and n.type = 'invoice_overdue' and n.created_at::date = current_date
    );

  -- Expense categories that have gone over their forecast_amount, rolled up
  -- to include sub-category spend on the parent's own check (a sub-category
  -- is also checked on its own, against its own forecast).
  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  select em.user_id, c.event_id, 'budget_overspend', 'Dépassement de budget',
    c.name || ' : dépenses au-delà du prévisionnel', '/budget', 'budget_categories', c.id
  from budget_categories c
  join event_members em on em.event_id = c.event_id
  join role_permissions rp on rp.role_id = em.role_id
  join permissions p on p.id = rp.permission_id and p.module = 'budget' and p.action = 'view' and rp.allowed = true
  where c.kind = 'expense'
    and (
      select coalesce(sum(ft.amount_ttc), 0)
      from financial_transactions ft
      where ft.status != 'cancelled'
        and (ft.category_id = c.id or ft.category_id in (
          select id from budget_categories where parent_category_id = c.id
        ))
    ) > c.forecast_amount
    and not exists (
      select 1 from notifications n
      where n.user_id = em.user_id and n.related_resource_type = 'budget_categories' and n.related_resource_id = c.id
        and n.type = 'budget_overspend' and n.created_at::date = current_date
    );
end;
$$;
