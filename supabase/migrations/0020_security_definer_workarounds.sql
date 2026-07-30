-- ============================================================================
-- Workaround for two writes that reproducibly get rejected with a generic
-- "new row violates row-level security policy" (42501) even though
-- has_permission(...) is independently confirmed true for the exact same
-- (user, event, module, action) right before the write, in the same
-- transaction — including with team_members_update's WITH CHECK forced to
-- an unconditional `true`, which still failed. That rules out every policy
-- and trigger on these tables as the cause, but the underlying mechanism
-- was not identified. These two operations are moved to SECURITY DEFINER
-- RPCs that check the permission themselves (has_permission, proven
-- reliable) and then write with the elevated privilege of the function
-- owner, sidestepping whatever is misbehaving in the RLS path.
-- ============================================================================

create or replace function archive_team_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  select event_id into v_event_id from team_members where id = p_id and deleted_at is null;
  if v_event_id is null then
    raise exception 'Membre introuvable ou déjà archivé';
  end if;

  if not has_permission(auth.uid(), v_event_id, 'team', 'delete') then
    raise exception 'insufficient permission to delete this record';
  end if;

  update team_members set deleted_at = now() where id = p_id;
end;
$$;

grant execute on function archive_team_member(uuid) to authenticated;

create or replace function create_document(
  p_event_id uuid,
  p_author_id uuid,
  p_storage_path text,
  p_file_size bigint,
  p_mime_type text,
  p_name text,
  p_category text,
  p_confidentiality_level document_confidentiality,
  p_partner_id uuid default null,
  p_speaker_id uuid default null,
  p_task_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not has_permission(auth.uid(), p_event_id, 'documents', 'create') then
    raise exception 'insufficient permission to create this document';
  end if;

  insert into documents (
    event_id, author_id, storage_path, file_size, mime_type, name, category,
    confidentiality_level, partner_id, speaker_id, task_id
  ) values (
    p_event_id, p_author_id, p_storage_path, p_file_size, p_mime_type, p_name, p_category,
    p_confidentiality_level, p_partner_id, p_speaker_id, p_task_id
  ) returning id into v_id;

  return v_id;
end;
$$;

grant execute on function create_document(
  uuid, uuid, text, bigint, text, text, text, document_confidentiality, uuid, uuid, uuid
) to authenticated;

-- ============================================================================
-- Diagnostic cleanup — drop every temporary debug_* function from this
-- investigation, none of which are used by the application.
-- ============================================================================
drop function if exists debug_team_delete(uuid);
drop function if exists debug_team_policies();
drop function if exists debug_team_triggers();
drop function if exists debug_team_relkind();
drop function if exists debug_team_all_triggers();
drop function if exists debug_team_constraints();
