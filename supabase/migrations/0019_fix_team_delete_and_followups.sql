-- ============================================================================
-- Fix 1: team_members archive/delete fails with a generic RLS 42501 error
-- even though has_permission(user, event, 'team', 'edit') and is_super_admin
-- both resolve to true. Given the manual (SQL Editor, copy/paste) migration
-- history on this project has already hit partial-apply errors before
-- (duplicate key on 0016, ownership error on an earlier attempt), the most
-- likely explanation is that the live policy has drifted from source. This
-- re-syncs the team_members policies from scratch, byte-for-byte with
-- 0011_rls_policies.sql, so there is no ambiguity about what is actually live.
-- ============================================================================
drop policy if exists team_members_select on team_members;
drop policy if exists team_members_insert on team_members;
drop policy if exists team_members_update on team_members;

create policy team_members_select on team_members for select using (
  deleted_at is null and has_permission(auth.uid(), event_id, 'team', 'view')
);
create policy team_members_insert on team_members for insert with check (
  has_permission(auth.uid(), event_id, 'team', 'create')
);
create policy team_members_update on team_members for update using (
  has_permission(auth.uid(), event_id, 'team', 'edit')
) with check (has_permission(auth.uid(), event_id, 'team', 'edit'));

-- ============================================================================
-- Fix 2: archiving a partner leaves its open follow-ups (upcoming/due_today/
-- overdue) dangling, so counts like the dashboard's "relances à effectuer"
-- keep including reminders that belong to a partner which no longer exists
-- from the user's point of view. Auto-resolve a partner's open follow-ups the
-- moment it is archived, and backfill the ones already affected.
-- ============================================================================
create or replace function resolve_followups_on_partner_archive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    update partner_followups
    set status = 'done', completed_at = coalesce(completed_at, now())
    where partner_id = new.id and status <> 'done';
  end if;
  return new;
end;
$$;

drop trigger if exists partners_resolve_followups_on_archive on partners;
create trigger partners_resolve_followups_on_archive
  after update on partners
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function resolve_followups_on_partner_archive();

-- Backfill: resolve follow-ups for partners already archived before this fix.
update partner_followups f
set status = 'done', completed_at = coalesce(f.completed_at, now())
from partners p
where p.id = f.partner_id and p.deleted_at is not null and f.status <> 'done';
