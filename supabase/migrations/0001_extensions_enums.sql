-- Extensions
create extension if not exists pgcrypto with schema public;

-- Event lifecycle
create type event_status as enum ('planning', 'active', 'completed', 'cancelled');

-- RBAC
create type member_status as enum ('active', 'inactive');
create type permission_scope as enum ('all', 'assigned', 'own', 'none');
create type access_request_status as enum ('pending', 'approved', 'denied', 'approved_temporary');

-- Team
create type team_pole as enum (
  'direction', 'partners', 'speakers', 'communication',
  'logistics', 'technical', 'reception', 'finance', 'volunteers'
);

-- Partners
create type partner_priority as enum ('low', 'medium', 'high');
create type partner_status as enum (
  'to_research', 'to_prospect', 'first_contact_done', 'awaiting_response',
  'to_follow_up', 'meeting_scheduled', 'in_negotiation', 'proposal_sent',
  'agreement_in_principle', 'confirmed', 'contract_signed',
  'declined', 'no_response', 'abandoned'
);
create type contribution_type as enum ('financial', 'in_kind', 'media', 'institutional', 'other');
create type interaction_type as enum (
  'email', 'call', 'meeting', 'linkedin', 'proposal_sent',
  'convention_sent', 'invoice_sent', 'followup', 'note', 'status_change'
);
create type followup_status as enum ('upcoming', 'due_today', 'overdue', 'done');
create type document_send_status as enum ('draft', 'prepared', 'sent', 'opened', 'signed', 'pending');

-- Speakers
create type speaker_status as enum (
  'considered', 'to_contact', 'contacted', 'in_discussion', 'awaiting_response',
  'confirmed', 'declined', 'withdrawn', 'talk_in_progress',
  'talk_to_validate', 'talk_validated', 'ready'
);
create type speaker_checklist_key as enum (
  'agreement_obtained', 'contract_signed', 'image_rights_consent',
  'bio_received', 'hd_photo_received', 'title_received', 'summary_received',
  'talk_draft_received', 'slides_received', 'slides_validated',
  'rehearsal_1_done', 'rehearsal_2_done', 'transport_booked',
  'hotel_booked', 'technical_info_validated'
);

-- Tasks
create type task_module_ref as enum ('partners', 'speakers', 'team', 'budget', 'documents', 'general');
create type task_status as enum ('todo', 'in_progress', 'waiting', 'blocked', 'to_validate', 'done', 'cancelled');
create type task_priority as enum ('low', 'normal', 'high', 'urgent');

-- Finance
create type transaction_type as enum ('revenue', 'expense');
create type transaction_status as enum ('planned', 'engaged', 'invoiced', 'paid', 'overdue', 'cancelled');
create type payment_method as enum ('bank_transfer', 'check', 'cash', 'card', 'other');
create type invoice_type as enum ('sent_to_partner', 'received_from_supplier');
create type invoice_status as enum (
  'draft', 'to_send', 'sent', 'pending', 'paid',
  'partially_paid', 'overdue', 'cancelled'
);

-- Documents
create type document_confidentiality as enum (
  'team_public', 'pole_restricted', 'assigned_only', 'confidential', 'super_admin_only'
);

-- Calendar
create type calendar_item_type as enum (
  'meeting', 'followup', 'deadline', 'rehearsal', 'partner_appointment',
  'speaker_appointment', 'payment_date', 'contractual_deadline', 'internal', 'd_day'
);
create type calendar_visibility as enum ('all', 'pole', 'assigned');

-- Activity log
create type activity_action as enum (
  'login', 'create', 'update', 'delete', 'download', 'status_change',
  'permission_change', 'user_added', 'user_removed', 'partner_validated', 'view_sensitive'
);

-- Generic updated_at trigger, reused by every table below.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
