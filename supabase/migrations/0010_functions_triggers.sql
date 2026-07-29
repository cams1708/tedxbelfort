-- ============================================================================
-- Permission resolution engine.
-- All are SECURITY DEFINER + STABLE: they run with the privileges of the
-- function owner (bypassing RLS on the tables they read internally), which
-- is what lets them be called safely from inside RLS policies on those same
-- tables without recursion.
-- ============================================================================

create or replace function is_super_admin(p_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select p.is_super_admin from profiles p where p.id = p_user), false);
$$;

create or replace function is_event_member(p_user uuid, p_event uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select is_super_admin(p_user) or exists (
    select 1 from event_members
    where user_id = p_user and event_id = p_event and status = 'active'
  );
$$;

-- Effective allow/deny for one (module, action) pair, resolved as:
--   1. super_admin always wins
--   2. an individual override (allow or explicit deny) wins over the role
--   3. otherwise fall back to the role's grant
--   4. default deny
--
-- Guarded against impersonation: this is directly callable via
-- supabase.rpc() by any authenticated client (RLS policies need it
-- executable by the `authenticated` role), so without this check anyone
-- could probe another user's permissions by passing an arbitrary p_user.
-- Only the user themselves, or a super_admin (for "Prévisualiser les
-- accès"), may resolve permissions for a given p_user.
create or replace function has_permission(p_user uuid, p_event uuid, p_module text, p_action text)
returns boolean
language sql stable security definer set search_path = public
as $$
  with resolved as (
    select
      (
        select upo.allowed from user_permission_overrides upo
        join permissions p on p.id = upo.permission_id
        where upo.user_id = p_user and upo.event_id = p_event
          and p.module = p_module and p.action = p_action
          and (upo.expires_at is null or upo.expires_at > now())
        order by upo.created_at desc
        limit 1
      ) as override_allowed,
      (
        select rp.allowed from event_members em
        join role_permissions rp on rp.role_id = em.role_id
        join permissions p on p.id = rp.permission_id
        where em.user_id = p_user and em.event_id = p_event and em.status = 'active'
          and p.module = p_module and p.action = p_action
        limit 1
      ) as role_allowed
  )
  select (p_user = auth.uid() or is_super_admin(auth.uid()))
    and (
      is_super_admin(p_user) or coalesce(
        (select override_allowed from resolved),
        (select role_allowed from resolved),
        false
      )
    );
$$;

-- Record-visibility scope ('all' | 'assigned' | 'own' | 'none') for a
-- (module, action) pair, following the same override-then-role precedence.
-- Guarded against impersonation the same way as has_permission() above.
create or replace function get_scope(p_user uuid, p_event uuid, p_module text, p_action text default 'view')
returns permission_scope
language sql stable security definer set search_path = public
as $$
  with resolved as (
    select
      (
        select upo.scope from user_permission_overrides upo
        join permissions p on p.id = upo.permission_id
        where upo.user_id = p_user and upo.event_id = p_event
          and p.module = p_module and p.action = p_action
          and upo.allowed = true
          and (upo.expires_at is null or upo.expires_at > now())
        order by upo.created_at desc
        limit 1
      ) as override_scope,
      (
        select rp.scope from event_members em
        join role_permissions rp on rp.role_id = em.role_id
        join permissions p on p.id = rp.permission_id
        where em.user_id = p_user and em.event_id = p_event and em.status = 'active'
          and p.module = p_module and p.action = p_action and rp.allowed = true
        limit 1
      ) as role_scope
  )
  select case
    when not (p_user = auth.uid() or is_super_admin(auth.uid())) then 'none'::permission_scope
    when is_super_admin(p_user) then 'all'::permission_scope
    else coalesce(
      (select override_scope from resolved),
      (select role_scope from resolved),
      'none'::permission_scope
    )
  end;
$$;

-- Individual exception granting access to one specific record regardless
-- of the role's scope (e.g. a volunteer given access to exactly one speaker).
create or replace function has_resource_override(p_user uuid, p_event uuid, p_resource_type text, p_resource_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select (p_user = auth.uid() or is_super_admin(auth.uid())) and exists (
    select 1 from user_permission_overrides
    where user_id = p_user and event_id = p_event
      and resource_type = p_resource_type and resource_id = p_resource_id
      and allowed = true
      and (expires_at is null or expires_at > now())
  );
$$;

-- ============================================================================
-- Per-entity visibility helpers. Each wraps the has_permission / get_scope /
-- has_resource_override precedence for one concrete table, so the exact same
-- rule is shared between the entity's own RLS policy and every child table
-- that hangs off it (interactions, checklist items, comments, documents...).
-- ============================================================================

create or replace function can_view_partner(p_user uuid, p_partner_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from partners p
    where p.id = p_partner_id and p.deleted_at is null
      and has_permission(p_user, p.event_id, 'partners', 'view')
      and (
        get_scope(p_user, p.event_id, 'partners', 'view') = 'all'
        or (get_scope(p_user, p.event_id, 'partners', 'view') = 'assigned' and p.owner_id = p_user)
        or (get_scope(p_user, p.event_id, 'partners', 'view') = 'own' and p.created_by = p_user)
        or has_resource_override(p_user, p.event_id, 'partners', p.id)
      )
  );
$$;

create or replace function can_edit_partner(p_user uuid, p_partner_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from partners p
    where p.id = p_partner_id
      and has_permission(p_user, p.event_id, 'partners', 'edit')
      and (
        get_scope(p_user, p.event_id, 'partners', 'edit') = 'all'
        or (get_scope(p_user, p.event_id, 'partners', 'edit') = 'assigned' and p.owner_id = p_user)
        or (get_scope(p_user, p.event_id, 'partners', 'edit') = 'own' and p.created_by = p_user)
        or has_resource_override(p_user, p.event_id, 'partners', p.id)
      )
  );
$$;

create or replace function can_view_speaker(p_user uuid, p_speaker_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from speakers s
    where s.id = p_speaker_id and s.deleted_at is null
      and has_permission(p_user, s.event_id, 'speakers', 'view')
      and (
        get_scope(p_user, s.event_id, 'speakers', 'view') = 'all'
        or (get_scope(p_user, s.event_id, 'speakers', 'view') = 'assigned' and s.owner_id = p_user)
        or (get_scope(p_user, s.event_id, 'speakers', 'view') = 'own' and s.created_by = p_user)
        or has_resource_override(p_user, s.event_id, 'speakers', s.id)
      )
  );
$$;

create or replace function can_edit_speaker(p_user uuid, p_speaker_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from speakers s
    where s.id = p_speaker_id
      and has_permission(p_user, s.event_id, 'speakers', 'edit')
      and (
        get_scope(p_user, s.event_id, 'speakers', 'edit') = 'all'
        or (get_scope(p_user, s.event_id, 'speakers', 'edit') = 'assigned' and s.owner_id = p_user)
        or (get_scope(p_user, s.event_id, 'speakers', 'edit') = 'own' and s.created_by = p_user)
        or has_resource_override(p_user, s.event_id, 'speakers', s.id)
      )
  );
$$;

create or replace function can_view_task(p_user uuid, p_task_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tasks t
    where t.id = p_task_id and t.deleted_at is null
      and has_permission(p_user, t.event_id, 'tasks', 'view')
      and (
        get_scope(p_user, t.event_id, 'tasks', 'view') = 'all'
        or (
          get_scope(p_user, t.event_id, 'tasks', 'view') = 'assigned'
          and (t.owner_id = p_user or exists (
            select 1 from task_assignees ta where ta.task_id = t.id and ta.user_id = p_user
          ))
        )
        or (get_scope(p_user, t.event_id, 'tasks', 'view') = 'own' and t.created_by = p_user)
        or has_resource_override(p_user, t.event_id, 'tasks', t.id)
      )
  );
$$;

create or replace function can_edit_task(p_user uuid, p_task_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tasks t
    where t.id = p_task_id
      and has_permission(p_user, t.event_id, 'tasks', 'edit')
      and (
        get_scope(p_user, t.event_id, 'tasks', 'edit') = 'all'
        or (
          get_scope(p_user, t.event_id, 'tasks', 'edit') = 'assigned'
          and (t.owner_id = p_user or exists (
            select 1 from task_assignees ta where ta.task_id = t.id and ta.user_id = p_user
          ))
        )
        or (get_scope(p_user, t.event_id, 'tasks', 'edit') = 'own' and t.created_by = p_user)
        or has_resource_override(p_user, t.event_id, 'tasks', t.id)
      )
  );
$$;

create or replace function can_view_followup(p_user uuid, p_followup_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from partner_followups f
    where f.id = p_followup_id
      and has_permission(p_user, f.event_id, 'followups', 'view')
      and (
        get_scope(p_user, f.event_id, 'followups', 'view') = 'all'
        or (get_scope(p_user, f.event_id, 'followups', 'view') = 'assigned' and f.assigned_to = p_user)
        or (get_scope(p_user, f.event_id, 'followups', 'view') = 'own' and f.created_by = p_user)
        or has_resource_override(p_user, f.event_id, 'followups', f.id)
      )
  );
$$;

create or replace function can_edit_followup(p_user uuid, p_followup_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from partner_followups f
    where f.id = p_followup_id
      and has_permission(p_user, f.event_id, 'followups', 'edit')
      and (
        get_scope(p_user, f.event_id, 'followups', 'edit') = 'all'
        or (get_scope(p_user, f.event_id, 'followups', 'edit') = 'assigned' and f.assigned_to = p_user)
        or (get_scope(p_user, f.event_id, 'followups', 'edit') = 'own' and f.created_by = p_user)
        or has_resource_override(p_user, f.event_id, 'followups', f.id)
      )
  );
$$;

create or replace function can_view_document(p_user uuid, p_document_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from documents d
    where d.id = p_document_id and d.deleted_at is null
      and has_permission(p_user, d.event_id, 'documents', 'view')
      and (
        is_super_admin(p_user)
        or d.author_id = p_user
        or d.confidentiality_level = 'team_public'
        or (
          d.confidentiality_level = 'pole_restricted' and exists (
            select 1 from document_access da
            join event_members em on em.user_id = p_user and em.event_id = d.event_id
            where da.document_id = d.id and da.pole = em.pole
          )
        )
        or (
          d.confidentiality_level = 'assigned_only' and exists (
            select 1 from document_access da where da.document_id = d.id and da.user_id = p_user
          )
        )
        or (
          d.confidentiality_level = 'confidential'
          and has_permission(p_user, d.event_id, 'documents', 'view_administrative')
        )
        -- 'super_admin_only' is intentionally excluded here: only the
        -- is_super_admin(p_user) short-circuit above can satisfy it.
      )
  );
$$;

create or replace function can_edit_document(p_user uuid, p_document_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select can_view_document(p_user, p_document_id) and exists (
    select 1 from documents d
    where d.id = p_document_id and has_permission(p_user, d.event_id, 'documents', 'edit')
  );
$$;

-- Bulk variant of has_permission/get_scope: the app calls this once per page
-- load (via supabase.rpc) instead of issuing one RPC per (module, action)
-- pair, to build the sidebar/menu gating and the "preview access" screen.
create or replace function get_effective_permissions(p_user uuid, p_event uuid)
returns table (module text, action text, allowed boolean, scope permission_scope)
language sql stable security definer set search_path = public
as $$
  select
    p.module,
    p.action,
    has_permission(p_user, p_event, p.module, p.action) as allowed,
    get_scope(p_user, p_event, p.module, p.action) as scope
  from permissions p
  where p_user = auth.uid() or is_super_admin(auth.uid());
$$;

-- ============================================================================
-- Login activity: Supabase Auth updates auth.users.last_sign_in_at on every
-- sign-in; the 0002 migration already mirrors it onto profiles. Now that
-- activity_logs exists, extend the same trigger function to also log it.
-- ============================================================================
create or replace function handle_user_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update profiles set last_sign_in_at = new.last_sign_in_at where id = new.id;
    insert into activity_logs (user_id, action, module, resource_type, resource_id)
    values (new.id, 'login', 'auth', 'profiles', new.id);
  end if;
  return new;
end;
$$;

-- ============================================================================
-- Generic audit trigger: logs create/update/delete on the tables it's
-- attached to. Tables without an event_id column (e.g. role_permissions)
-- simply log a null event_id.
-- ============================================================================
create or replace function log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_resource_id uuid;
  v_action activity_action;
  v_row record;
begin
  v_row := case when TG_OP = 'DELETE' then old else new end;

  if TG_OP = 'INSERT' then
    v_action := 'create';
  elsif TG_OP = 'UPDATE' then
    v_action := 'update';
  else
    v_action := 'delete';
  end if;

  begin
    v_event_id := v_row.event_id;
  exception when undefined_column then
    v_event_id := null;
  end;

  -- Tables with a composite primary key (e.g. role_permissions) have no
  -- `id` column; resource_id is simply left null for those.
  begin
    v_resource_id := v_row.id;
  exception when undefined_column then
    v_resource_id := null;
  end;

  insert into activity_logs (event_id, user_id, action, module, resource_type, resource_id, old_value, new_value)
  values (
    v_event_id,
    auth.uid(),
    v_action,
    TG_ARGV[0],
    TG_TABLE_NAME,
    v_resource_id,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return v_row;
end;
$$;

create trigger partners_log_activity after insert or update or delete on partners
  for each row execute function log_activity('partners');
create trigger speakers_log_activity after insert or update or delete on speakers
  for each row execute function log_activity('speakers');
create trigger tasks_log_activity after insert or update or delete on tasks
  for each row execute function log_activity('tasks');
create trigger invoices_log_activity after insert or update or delete on invoices
  for each row execute function log_activity('invoices');
create trigger financial_transactions_log_activity after insert or update or delete on financial_transactions
  for each row execute function log_activity('budget');
create trigger documents_log_activity after insert or update or delete on documents
  for each row execute function log_activity('documents');
create trigger event_members_log_activity after insert or update or delete on event_members
  for each row execute function log_activity('users');
create trigger user_permission_overrides_log_activity after insert or update or delete on user_permission_overrides
  for each row execute function log_activity('users');
create trigger role_permissions_log_activity after insert or update or delete on role_permissions
  for each row execute function log_activity('users');

-- ============================================================================
-- Only super_admin (or the platform, via the service role) may flip the
-- privileged flags on a profile — everyone else can only edit their own
-- basic info.
-- ============================================================================
create or replace function protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin(auth.uid()) then
    new.is_super_admin := old.is_super_admin;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin_fields
  before update on profiles
  for each row execute function protect_profile_admin_fields();

-- ============================================================================
-- Soft-delete gate: flipping deleted_at requires the dedicated `delete`
-- permission, distinct from `edit` (the base RLS update policy on these
-- tables only requires `edit`, which must not be enough to archive a record).
-- ============================================================================
create or replace function enforce_soft_delete_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at
     and not has_permission(auth.uid(), new.event_id, TG_ARGV[0], 'delete') then
    raise exception 'insufficient permission to delete this record';
  end if;
  return new;
end;
$$;

create trigger partners_enforce_delete before update on partners
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('partners');
create trigger speakers_enforce_delete before update on speakers
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('speakers');
create trigger tasks_enforce_delete before update on tasks
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('tasks');
create trigger invoices_enforce_delete before update on invoices
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('invoices');
create trigger documents_enforce_delete before update on documents
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('documents');
create trigger team_members_enforce_delete before update on team_members
  for each row when (new.deleted_at is distinct from old.deleted_at)
  execute function enforce_soft_delete_permission('team');
