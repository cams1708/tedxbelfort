-- ============================================================================
-- Event-driven notifications (fire immediately, no scheduler needed).
-- ============================================================================

create or replace function notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = new.task_id;

  insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
  values (
    new.user_id,
    v_task.event_id,
    'task_assigned',
    'Nouvelle tâche attribuée',
    v_task.title,
    '/tasks',
    'tasks',
    new.task_id
  );
  return new;
end;
$$;

create trigger task_assignees_notify after insert on task_assignees
  for each row execute function notify_task_assigned();

create or replace function notify_access_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester_name text;
  v_admin record;
begin
  select full_name into v_requester_name from profiles where id = new.user_id;

  for v_admin in select id from profiles where is_super_admin = true loop
    insert into notifications (user_id, event_id, type, title, body, link_url, related_resource_type, related_resource_id)
    values (
      v_admin.id,
      new.event_id,
      'access_request',
      'Nouvelle demande d’accès',
      coalesce(v_requester_name, 'Un membre') || ' demande l’accès à ' || new.permission_requested,
      '/admin/users',
      'access_requests',
      new.id
    );
  end loop;
  return new;
end;
$$;

create trigger access_requests_notify after insert on access_requests
  for each row execute function notify_access_request();

-- ============================================================================
-- Due-date reminders: not event-driven, must be invoked periodically.
-- Callable via `select generate_due_notifications();` — wire it to a
-- scheduler (pg_cron, if enabled on the project, or an external cron
-- hitting a protected route handler) to actually run on a schedule; it is
-- not triggered automatically by this migration alone.
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
end;
$$;
