-- ============================================================================
-- Organizational adjustments requested by the super-admin:
--   1. New "Trésorier" role: the only role (besides super_admin) allowed to
--      edit budget/invoices. Every other role becomes read-only on finance.
--   2. New "Vice-Président" role: same broad access as "Administrateur",
--      plus exclusive (with super_admin) edit rights on speakers.
--   3. "Responsable finances" is retired — replaced by "Trésorier".
--   4. "Membre de l'équipe" gains document upload rights (drive-like access).
--   5. Team members can self-service their own contact details regardless
--      of role permissions (new RLS policies + a trigger protecting the
--      admin-only confidential-notes field from being touched this way).
-- ============================================================================

insert into roles (event_id, name, slug, description, is_system) values
  (null, 'Trésorier', 'tresorier', 'Seul rôle, avec la super-administratrice, habilité à modifier le budget et les factures.', true),
  (null, 'Vice-Président', 'vice_president', 'Accès aussi large que Administrateur, avec l’exclusivité (partagée avec la super-administratrice) de l’édition des speakers et de leurs coordonnées.', true);

-- Retire the old finance role entirely (role_permissions cascade on delete).
delete from roles where slug = 'finance_manager' and event_id is null;

-- Strip budget/invoices create/edit/delete from every role except Trésorier
-- (super_admin already bypasses all of this at the has_permission() level).
delete from role_permissions
where permission_id in (
    select id from permissions where module in ('budget', 'invoices') and action in ('create', 'edit', 'delete')
  )
  and role_id in (select id from roles where slug not in ('tresorier', 'super_admin') and event_id is null);

-- Grant read-only budget/invoices visibility to every role except Bénévole
-- (deliberately excluded — minimal-by-default, extendable via individual
-- overrides) and the roles that already have it.
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.event_id is null
  and r.slug not in ('volunteer', 'super_admin', 'tresorier')
  and p.key in ('budget.view', 'invoices.view')
  and not exists (
    select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
  );

-- Speakers lockdown: only super_admin and Vice-Président may create/edit/
-- delete/change status/assign/import speakers, or see their personal contact
-- details. Strip those from every role that currently has them.
delete from role_permissions
where permission_id in (
    select id from permissions
    where module = 'speakers'
      and action in ('create', 'edit', 'delete', 'change_status', 'assign', 'import', 'view_personal_info')
  )
  and role_id in (select id from roles where slug not in ('vice_president', 'super_admin') and event_id is null);

-- Trésorier: full finance module + enough context to attach receipts.
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.slug = 'tresorier' and r.event_id is null
  and p.key in (
    'dashboard.view',
    'budget.view', 'budget.create', 'budget.edit', 'budget.delete', 'budget.export', 'budget.view_bank_details',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.download', 'invoices.export',
    'documents.view', 'documents.create', 'documents.view_administrative'
  )
  and not exists (select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- Vice-Président: clone of Administrateur's broad access (finance stays
-- read-only — already granted above by the generic "everyone except
-- Bénévole" step — plus full speaker edit rights and visibility of
-- speakers' personal contact details.
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.slug = 'vice_president' and r.event_id is null
  and p.key in (
    'dashboard.view',
    'partners.view', 'partners.create', 'partners.edit', 'partners.delete', 'partners.download', 'partners.import',
    'partners.export', 'partners.assign', 'partners.change_status', 'partners.view_history', 'partners.view_comments',
    'partners.view_amounts', 'partners.view_confidential_notes',
    'speakers.view', 'speakers.create', 'speakers.edit', 'speakers.delete', 'speakers.download', 'speakers.import',
    'speakers.export', 'speakers.assign', 'speakers.change_status', 'speakers.view_history', 'speakers.view_comments',
    'speakers.view_personal_info',
    'team.view', 'team.create', 'team.edit', 'team.delete', 'team.export', 'team.assign', 'team.view_personal_data',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign', 'tasks.change_status',
    'tasks.view_comments', 'tasks.export',
    'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete', 'calendar.export',
    'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.download',
    'documents.import', 'documents.export', 'documents.view_history', 'documents.view_administrative',
    'followups.view', 'followups.create', 'followups.edit', 'followups.delete', 'followups.assign',
    'followups.change_status', 'followups.export',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit',
    'activity_log.view'
  )
  and not exists (select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- Drive-like access: regular team members can upload documents visible to
-- the whole team (confidentiality level is still chosen per document).
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
join permissions p on p.key = 'documents.create'
where r.slug = 'team_member' and r.event_id is null
  and not exists (select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- ============================================================================
-- Self-service contact details: any team member can view/complete their own
-- email and phone regardless of role permissions. The admin-only
-- confidential notes field stays protected by a trigger even on this path.
-- ============================================================================
create policy team_members_select_self on team_members for select using (
  profile_id = auth.uid()
);

create policy team_member_private_select_self on team_member_private for select using (
  exists (select 1 from team_members t where t.id = team_member_private.team_member_id and t.profile_id = auth.uid())
);

create policy team_member_private_insert_self on team_member_private for insert with check (
  exists (select 1 from team_members t where t.id = team_member_private.team_member_id and t.profile_id = auth.uid())
);

create policy team_member_private_update_self on team_member_private for update using (
  exists (select 1 from team_members t where t.id = team_member_private.team_member_id and t.profile_id = auth.uid())
) with check (
  exists (select 1 from team_members t where t.id = team_member_private.team_member_id and t.profile_id = auth.uid())
);

create or replace function protect_team_member_private_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_can_edit boolean;
begin
  select event_id into v_event_id from team_members where id = new.team_member_id;
  v_can_edit := has_permission(auth.uid(), v_event_id, 'team', 'edit');

  if not v_can_edit then
    if TG_OP = 'UPDATE' then
      new.admin_confidential_notes := old.admin_confidential_notes;
    else
      new.admin_confidential_notes := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger team_member_private_protect_admin_fields
  before insert or update on team_member_private
  for each row execute function protect_team_member_private_admin_fields();
