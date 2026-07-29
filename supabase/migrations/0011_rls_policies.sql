-- ============================================================================
-- profiles
-- ============================================================================
alter table profiles enable row level security;

create policy profiles_select on profiles for select using (
  id = auth.uid()
  or is_super_admin(auth.uid())
  or exists (
    select 1 from event_members em1
    join event_members em2 on em1.event_id = em2.event_id
    where em1.user_id = auth.uid() and em1.status = 'active'
      and em2.user_id = profiles.id and em2.status = 'active'
  )
);

create policy profiles_update on profiles for update using (
  id = auth.uid() or is_super_admin(auth.uid())
) with check (
  id = auth.uid() or is_super_admin(auth.uid())
);
-- No insert/delete policy: profile rows are only ever created by the
-- handle_new_user() trigger (security definer) and are never hard-deleted.

-- ============================================================================
-- events
-- ============================================================================
alter table events enable row level security;

create policy events_select on events for select using (is_event_member(auth.uid(), id));

create policy events_insert on events for insert with check (is_super_admin(auth.uid()));

create policy events_update on events for update using (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), id, 'settings', 'edit')
) with check (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), id, 'settings', 'edit')
);

create policy events_delete on events for delete using (is_super_admin(auth.uid()));

alter table event_bank_details enable row level security;

create policy event_bank_details_select on event_bank_details for select using (
  has_permission(auth.uid(), event_id, 'budget', 'view_bank_details')
);
create policy event_bank_details_write on event_bank_details for all using (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'settings', 'edit')
) with check (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'settings', 'edit')
);

-- ============================================================================
-- roles
-- ============================================================================
alter table roles enable row level security;

create policy roles_select on roles for select using (
  event_id is null or is_event_member(auth.uid(), event_id)
);

create policy roles_insert on roles for insert with check (is_super_admin(auth.uid()));
create policy roles_update on roles for update using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));
create policy roles_delete on roles for delete using (is_super_admin(auth.uid()) and not is_system);

-- ============================================================================
-- permissions (static catalog)
-- ============================================================================
alter table permissions enable row level security;

create policy permissions_select on permissions for select using (auth.uid() is not null);
create policy permissions_write on permissions for all using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));

-- ============================================================================
-- role_permissions
-- ============================================================================
alter table role_permissions enable row level security;

create policy role_permissions_select on role_permissions for select using (is_super_admin(auth.uid()));
create policy role_permissions_write on role_permissions for all using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));

-- ============================================================================
-- event_members
-- ============================================================================
alter table event_members enable row level security;

create policy event_members_select on event_members for select using (is_event_member(auth.uid(), event_id));
create policy event_members_write on event_members for all using (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
) with check (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
);

-- ============================================================================
-- user_permission_overrides
-- ============================================================================
alter table user_permission_overrides enable row level security;

create policy user_permission_overrides_select on user_permission_overrides for select using (
  user_id = auth.uid() or is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'view')
);
create policy user_permission_overrides_write on user_permission_overrides for all using (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
) with check (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
);

-- ============================================================================
-- access_requests
-- ============================================================================
alter table access_requests enable row level security;

create policy access_requests_select on access_requests for select using (
  user_id = auth.uid() or is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'view')
);
create policy access_requests_insert on access_requests for insert with check (
  user_id = auth.uid() and is_event_member(auth.uid(), event_id)
);
create policy access_requests_update on access_requests for update using (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
) with check (
  is_super_admin(auth.uid()) or has_permission(auth.uid(), event_id, 'users', 'edit')
);

-- ============================================================================
-- partners
-- ============================================================================
alter table partners enable row level security;

create policy partners_select on partners for select using (can_view_partner(auth.uid(), id));
create policy partners_insert on partners for insert with check (has_permission(auth.uid(), event_id, 'partners', 'create'));
create policy partners_update on partners for update using (can_edit_partner(auth.uid(), id))
  with check (has_permission(auth.uid(), event_id, 'partners', 'edit'));
-- No delete policy: archiving goes through deleted_at (update), gated by
-- enforce_soft_delete_permission requiring the dedicated 'delete' action.

-- partner_amounts / partner_confidential_notes: sensitive, split from
-- partners (see 0004) — each gated by its own distinct permission.
alter table partner_amounts enable row level security;

create policy partner_amounts_select on partner_amounts for select using (
  can_view_partner(auth.uid(), partner_id)
  and exists (
    select 1 from partners p where p.id = partner_amounts.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_amounts')
  )
);
create policy partner_amounts_write on partner_amounts for all using (
  can_edit_partner(auth.uid(), partner_id)
  and exists (
    select 1 from partners p where p.id = partner_amounts.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_amounts')
  )
) with check (
  exists (
    select 1 from partners p where p.id = partner_amounts.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'edit')
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_amounts')
  )
);

alter table partner_confidential_notes enable row level security;

create policy partner_confidential_notes_select on partner_confidential_notes for select using (
  can_view_partner(auth.uid(), partner_id)
  and exists (
    select 1 from partners p where p.id = partner_confidential_notes.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_confidential_notes')
  )
);
create policy partner_confidential_notes_write on partner_confidential_notes for all using (
  can_edit_partner(auth.uid(), partner_id)
  and exists (
    select 1 from partners p where p.id = partner_confidential_notes.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_confidential_notes')
  )
) with check (
  exists (
    select 1 from partners p where p.id = partner_confidential_notes.partner_id
      and has_permission(auth.uid(), p.event_id, 'partners', 'edit')
      and has_permission(auth.uid(), p.event_id, 'partners', 'view_confidential_notes')
  )
);

alter table partner_contacts enable row level security;

create policy partner_contacts_select on partner_contacts for select using (can_view_partner(auth.uid(), partner_id));
create policy partner_contacts_write on partner_contacts for all using (can_edit_partner(auth.uid(), partner_id))
  with check (can_edit_partner(auth.uid(), partner_id));

-- partner_interactions: append-only history ("historique des échanges").
alter table partner_interactions enable row level security;

create policy partner_interactions_select on partner_interactions for select using (
  can_view_partner(auth.uid(), partner_id)
  and has_permission(auth.uid(), event_id, 'partners', 'view_history')
);
create policy partner_interactions_insert on partner_interactions for insert with check (
  can_edit_partner(auth.uid(), partner_id)
);

-- partner_followups: its own 'followups' module + scope.
alter table partner_followups enable row level security;

create policy partner_followups_select on partner_followups for select using (can_view_followup(auth.uid(), id));
create policy partner_followups_insert on partner_followups for insert with check (
  has_permission(auth.uid(), event_id, 'followups', 'create')
);
create policy partner_followups_update on partner_followups for update using (can_edit_followup(auth.uid(), id))
  with check (has_permission(auth.uid(), event_id, 'followups', 'edit'));

alter table partner_document_sends enable row level security;

create policy partner_document_sends_select on partner_document_sends for select using (
  can_view_partner(auth.uid(), partner_id)
);
create policy partner_document_sends_write on partner_document_sends for all using (
  can_edit_partner(auth.uid(), partner_id)
) with check (can_edit_partner(auth.uid(), partner_id));

-- ============================================================================
-- speakers
-- ============================================================================
alter table speakers enable row level security;

create policy speakers_select on speakers for select using (can_view_speaker(auth.uid(), id));
create policy speakers_insert on speakers for insert with check (has_permission(auth.uid(), event_id, 'speakers', 'create'));
create policy speakers_update on speakers for update using (can_edit_speaker(auth.uid(), id))
  with check (has_permission(auth.uid(), event_id, 'speakers', 'edit'));

alter table speaker_private enable row level security;

create policy speaker_private_select on speaker_private for select using (
  can_view_speaker(auth.uid(), speaker_id)
  and exists (
    select 1 from speakers s where s.id = speaker_private.speaker_id
      and has_permission(auth.uid(), s.event_id, 'speakers', 'view_personal_info')
  )
);
create policy speaker_private_write on speaker_private for all using (
  can_edit_speaker(auth.uid(), speaker_id)
  and exists (
    select 1 from speakers s where s.id = speaker_private.speaker_id
      and has_permission(auth.uid(), s.event_id, 'speakers', 'view_personal_info')
  )
) with check (
  exists (
    select 1 from speakers s where s.id = speaker_private.speaker_id
      and has_permission(auth.uid(), s.event_id, 'speakers', 'edit')
      and has_permission(auth.uid(), s.event_id, 'speakers', 'view_personal_info')
  )
);

alter table speaker_checklist_items enable row level security;

create policy speaker_checklist_items_select on speaker_checklist_items for select using (
  can_view_speaker(auth.uid(), speaker_id)
);
create policy speaker_checklist_items_write on speaker_checklist_items for all using (
  can_edit_speaker(auth.uid(), speaker_id)
) with check (can_edit_speaker(auth.uid(), speaker_id));

alter table speaker_timeline enable row level security;

create policy speaker_timeline_select on speaker_timeline for select using (
  can_view_speaker(auth.uid(), speaker_id)
  and exists (
    select 1 from speakers s where s.id = speaker_timeline.speaker_id
      and has_permission(auth.uid(), s.event_id, 'speakers', 'view_history')
  )
);
create policy speaker_timeline_insert on speaker_timeline for insert with check (
  can_edit_speaker(auth.uid(), speaker_id)
);

-- ============================================================================
-- team_members (no per-record scope per spec — module-level gate only)
-- ============================================================================
alter table team_members enable row level security;

create policy team_members_select on team_members for select using (
  deleted_at is null and has_permission(auth.uid(), event_id, 'team', 'view')
);
create policy team_members_insert on team_members for insert with check (
  has_permission(auth.uid(), event_id, 'team', 'create')
);
create policy team_members_update on team_members for update using (
  has_permission(auth.uid(), event_id, 'team', 'edit')
) with check (has_permission(auth.uid(), event_id, 'team', 'edit'));

alter table team_member_private enable row level security;

create policy team_member_private_select on team_member_private for select using (
  exists (
    select 1 from team_members t where t.id = team_member_private.team_member_id
      and t.deleted_at is null
      and has_permission(auth.uid(), t.event_id, 'team', 'view')
      and has_permission(auth.uid(), t.event_id, 'team', 'view_personal_data')
  )
);
create policy team_member_private_write on team_member_private for all using (
  exists (
    select 1 from team_members t where t.id = team_member_private.team_member_id
      and has_permission(auth.uid(), t.event_id, 'team', 'edit')
      and has_permission(auth.uid(), t.event_id, 'team', 'view_personal_data')
  )
) with check (
  exists (
    select 1 from team_members t where t.id = team_member_private.team_member_id
      and has_permission(auth.uid(), t.event_id, 'team', 'edit')
      and has_permission(auth.uid(), t.event_id, 'team', 'view_personal_data')
  )
);

-- ============================================================================
-- tasks
-- ============================================================================
alter table tasks enable row level security;

create policy tasks_select on tasks for select using (can_view_task(auth.uid(), id));
create policy tasks_insert on tasks for insert with check (has_permission(auth.uid(), event_id, 'tasks', 'create'));
create policy tasks_update on tasks for update using (can_edit_task(auth.uid(), id))
  with check (has_permission(auth.uid(), event_id, 'tasks', 'edit'));

alter table task_assignees enable row level security;

create policy task_assignees_select on task_assignees for select using (can_view_task(auth.uid(), task_id));
create policy task_assignees_write on task_assignees for all using (
  exists (select 1 from tasks t where t.id = task_assignees.task_id and has_permission(auth.uid(), t.event_id, 'tasks', 'assign'))
) with check (
  exists (select 1 from tasks t where t.id = task_assignees.task_id and has_permission(auth.uid(), t.event_id, 'tasks', 'assign'))
);

alter table task_checklist_items enable row level security;

create policy task_checklist_items_select on task_checklist_items for select using (can_view_task(auth.uid(), task_id));
create policy task_checklist_items_write on task_checklist_items for all using (can_edit_task(auth.uid(), task_id))
  with check (can_edit_task(auth.uid(), task_id));

alter table task_comments enable row level security;

create policy task_comments_select on task_comments for select using (
  can_view_task(auth.uid(), task_id)
  and exists (
    select 1 from tasks t where t.id = task_comments.task_id
      and has_permission(auth.uid(), t.event_id, 'tasks', 'view_comments')
  )
);
create policy task_comments_insert on task_comments for insert with check (
  can_view_task(auth.uid(), task_id)
  and exists (
    select 1 from tasks t where t.id = task_comments.task_id
      and has_permission(auth.uid(), t.event_id, 'tasks', 'view_comments')
  )
);

-- ============================================================================
-- Finance: budget_categories, financial_transactions, invoices.
-- Entire module gated by module-level permission (budget/invoices), not
-- a scope — these tables never return a row without explicit finance access.
-- ============================================================================
alter table budget_categories enable row level security;

create policy budget_categories_select on budget_categories for select using (
  has_permission(auth.uid(), event_id, 'budget', 'view')
);
create policy budget_categories_write on budget_categories for all using (
  has_permission(auth.uid(), event_id, 'budget', 'edit')
) with check (has_permission(auth.uid(), event_id, 'budget', 'edit'));

alter table financial_transactions enable row level security;

create policy financial_transactions_select on financial_transactions for select using (
  has_permission(auth.uid(), event_id, 'budget', 'view')
);
create policy financial_transactions_insert on financial_transactions for insert with check (
  has_permission(auth.uid(), event_id, 'budget', 'create')
);
create policy financial_transactions_update on financial_transactions for update using (
  has_permission(auth.uid(), event_id, 'budget', 'edit')
) with check (has_permission(auth.uid(), event_id, 'budget', 'edit'));

alter table invoices enable row level security;

create policy invoices_select on invoices for select using (
  deleted_at is null and has_permission(auth.uid(), event_id, 'invoices', 'view')
);
create policy invoices_insert on invoices for insert with check (
  has_permission(auth.uid(), event_id, 'invoices', 'create')
);
create policy invoices_update on invoices for update using (
  has_permission(auth.uid(), event_id, 'invoices', 'edit')
) with check (has_permission(auth.uid(), event_id, 'invoices', 'edit'));

-- ============================================================================
-- documents
-- ============================================================================
alter table documents enable row level security;

create policy documents_select on documents for select using (can_view_document(auth.uid(), id));
create policy documents_insert on documents for insert with check (has_permission(auth.uid(), event_id, 'documents', 'create'));
create policy documents_update on documents for update using (can_edit_document(auth.uid(), id))
  with check (has_permission(auth.uid(), event_id, 'documents', 'edit'));

alter table document_access enable row level security;

create policy document_access_select on document_access for select using (
  exists (select 1 from documents d where d.id = document_access.document_id and has_permission(auth.uid(), d.event_id, 'documents', 'view'))
);
create policy document_access_write on document_access for all using (
  exists (select 1 from documents d where d.id = document_access.document_id and has_permission(auth.uid(), d.event_id, 'documents', 'edit'))
) with check (
  exists (select 1 from documents d where d.id = document_access.document_id and has_permission(auth.uid(), d.event_id, 'documents', 'edit'))
);

alter table document_downloads enable row level security;

create policy document_downloads_select on document_downloads for select using (
  exists (select 1 from documents d where d.id = document_downloads.document_id and has_permission(auth.uid(), d.event_id, 'documents', 'view_history'))
);
create policy document_downloads_insert on document_downloads for insert with check (
  user_id = auth.uid() and can_view_document(auth.uid(), document_id)
);

-- ============================================================================
-- calendar_items / calendar_item_attendees
-- ============================================================================
alter table calendar_items enable row level security;

create policy calendar_items_select on calendar_items for select using (
  has_permission(auth.uid(), event_id, 'calendar', 'view')
  and (
    visibility = 'all'
    or is_super_admin(auth.uid())
    or (visibility = 'assigned' and (owner_id = auth.uid() or exists (
          select 1 from calendar_item_attendees a where a.calendar_item_id = calendar_items.id and a.user_id = auth.uid()
        )))
    or (visibility = 'pole' and exists (
          select 1 from event_members em where em.user_id = auth.uid() and em.event_id = calendar_items.event_id
            and em.pole is not null
        ))
  )
);
create policy calendar_items_insert on calendar_items for insert with check (
  has_permission(auth.uid(), event_id, 'calendar', 'create')
);
create policy calendar_items_update on calendar_items for update using (
  has_permission(auth.uid(), event_id, 'calendar', 'edit')
) with check (has_permission(auth.uid(), event_id, 'calendar', 'edit'));
create policy calendar_items_delete on calendar_items for delete using (
  has_permission(auth.uid(), event_id, 'calendar', 'delete')
);

alter table calendar_item_attendees enable row level security;

create policy calendar_item_attendees_select on calendar_item_attendees for select using (
  exists (select 1 from calendar_items c where c.id = calendar_item_attendees.calendar_item_id and has_permission(auth.uid(), c.event_id, 'calendar', 'view'))
);
create policy calendar_item_attendees_write on calendar_item_attendees for all using (
  exists (select 1 from calendar_items c where c.id = calendar_item_attendees.calendar_item_id and has_permission(auth.uid(), c.event_id, 'calendar', 'edit'))
) with check (
  exists (select 1 from calendar_items c where c.id = calendar_item_attendees.calendar_item_id and has_permission(auth.uid(), c.event_id, 'calendar', 'edit'))
);

-- ============================================================================
-- notifications: strictly private to their owner.
-- ============================================================================
alter table notifications enable row level security;

create policy notifications_select on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Inserts are performed by server-side actions/triggers using the admin
-- client (bypasses RLS) — no client-facing insert policy.

-- ============================================================================
-- activity_logs: append-only, super_admin-only read access.
-- ============================================================================
alter table activity_logs enable row level security;

create policy activity_logs_select on activity_logs for select using (is_super_admin(auth.uid()));
-- No insert/update/delete policy for client roles: all writes happen through
-- the log_activity() trigger and handle_user_sign_in(), both SECURITY
-- DEFINER and therefore exempt from RLS. Rows are otherwise immutable.
