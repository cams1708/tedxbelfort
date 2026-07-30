// Hand-authored to mirror supabase/migrations exactly. Once the project is
// linked to a live Supabase project, regenerate with:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EventStatus = "planning" | "active" | "completed" | "cancelled";
export type MemberStatus = "active" | "inactive";
export type PermissionScope = "all" | "assigned" | "own" | "none";
export type AccessRequestStatus = "pending" | "approved" | "denied" | "approved_temporary";
export type TeamPole =
  | "direction"
  | "partners"
  | "speakers"
  | "communication"
  | "logistics"
  | "technical"
  | "reception"
  | "finance"
  | "volunteers";
export type PartnerPriority = "low" | "medium" | "high";
export type PartnerStatus =
  | "to_research"
  | "to_prospect"
  | "first_contact_done"
  | "awaiting_response"
  | "to_follow_up"
  | "meeting_scheduled"
  | "in_negotiation"
  | "proposal_sent"
  | "agreement_in_principle"
  | "confirmed"
  | "contract_signed"
  | "declined"
  | "no_response"
  | "abandoned";
export type ContributionType = "financial" | "in_kind" | "media" | "institutional" | "other";
export type InteractionType =
  | "email"
  | "call"
  | "meeting"
  | "linkedin"
  | "proposal_sent"
  | "convention_sent"
  | "invoice_sent"
  | "followup"
  | "note"
  | "status_change";
export type FollowupStatus = "upcoming" | "due_today" | "overdue" | "done";
export type DocumentSendStatus = "draft" | "prepared" | "sent" | "opened" | "signed" | "pending";
export type SpeakerStatus =
  | "considered"
  | "to_contact"
  | "contacted"
  | "in_discussion"
  | "awaiting_response"
  | "confirmed"
  | "declined"
  | "withdrawn"
  | "talk_in_progress"
  | "talk_to_validate"
  | "talk_validated"
  | "ready";
export type SpeakerChecklistKey =
  | "agreement_obtained"
  | "contract_signed"
  | "image_rights_consent"
  | "bio_received"
  | "hd_photo_received"
  | "title_received"
  | "summary_received"
  | "talk_draft_received"
  | "slides_received"
  | "slides_validated"
  | "rehearsal_1_done"
  | "rehearsal_2_done"
  | "transport_booked"
  | "hotel_booked"
  | "technical_info_validated";
export type TaskModuleRef = "partners" | "speakers" | "team" | "budget" | "documents" | "general";
export type TaskStatus = "todo" | "in_progress" | "waiting" | "blocked" | "to_validate" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TransactionType = "revenue" | "expense";
export type TransactionStatus = "planned" | "engaged" | "invoiced" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "check" | "cash" | "card" | "other";
export type InvoiceType = "sent_to_partner" | "received_from_supplier";
export type InvoiceStatus =
  | "draft"
  | "to_send"
  | "sent"
  | "pending"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";
// Certainty/DocumentType are `text + check` in Postgres, not real enum types
// (deliberate — more likely to be tweaked than the foundational enums above).
export type Certainty = "certain" | "probable" | "potential";
export type DocumentType = "quote" | "purchase_order" | "invoice" | "credit_note";
export type SubsidyStatus = "requested" | "granted" | "partially_received" | "received" | "declined";
export type DocumentConfidentiality =
  | "team_public"
  | "pole_restricted"
  | "assigned_only"
  | "confidential"
  | "super_admin_only";
export type CalendarItemType =
  | "meeting"
  | "followup"
  | "deadline"
  | "rehearsal"
  | "partner_appointment"
  | "speaker_appointment"
  | "payment_date"
  | "contractual_deadline"
  | "internal"
  | "d_day";
export type CalendarVisibility = "all" | "pole" | "assigned";
export type ActivityAction =
  | "login"
  | "create"
  | "update"
  | "delete"
  | "download"
  | "status_change"
  | "permission_change"
  | "user_added"
  | "user_removed"
  | "partner_validated"
  | "view_sensitive";

interface Table<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          is_super_admin: boolean;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          is_super_admin?: boolean;
        },
        Partial<{
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          is_super_admin: boolean;
        }>
      >;
      events: Table<
        {
          id: string;
          name: string;
          slug: string;
          theme: string | null;
          description: string | null;
          event_date: string | null;
          location: string | null;
          status: EventStatus;
          logo_url: string | null;
          color_primary: string | null;
          color_secondary: string | null;
          sponsoring_goal: number | null;
          budget_forecast: number | null;
          currency: string;
          billing_info: Json;
          contact_info: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          theme?: string | null;
          description?: string | null;
          event_date?: string | null;
          location?: string | null;
          status?: EventStatus;
          logo_url?: string | null;
          color_primary?: string | null;
          color_secondary?: string | null;
          sponsoring_goal?: number | null;
          budget_forecast?: number | null;
          currency?: string;
          billing_info?: Json;
          contact_info?: Json;
          created_by?: string | null;
        },
        Partial<{
          name: string;
          slug: string;
          theme: string | null;
          description: string | null;
          event_date: string | null;
          location: string | null;
          status: EventStatus;
          logo_url: string | null;
          color_primary: string | null;
          color_secondary: string | null;
          sponsoring_goal: number | null;
          budget_forecast: number | null;
          currency: string;
          billing_info: Json;
          contact_info: Json;
        }>
      >;
      event_bank_details: Table<
        { event_id: string; bank_name: string | null; iban: string | null; bic: string | null; notes: string | null; updated_at: string },
        { event_id: string; bank_name?: string | null; iban?: string | null; bic?: string | null; notes?: string | null },
        Partial<{ bank_name: string | null; iban: string | null; bic: string | null; notes: string | null }>
      >;
      roles: Table<
        {
          id: string;
          event_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          is_system: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          event_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          is_system?: boolean;
          created_by?: string | null;
        },
        Partial<{ name: string; slug: string; description: string | null; is_system: boolean }>
      >;
      permissions: Table<
        {
          id: string;
          module: string;
          action: string;
          key: string;
          is_sensitive: boolean;
          description: string | null;
          created_at: string;
        },
        { id?: string; module: string; action: string; key: string; is_sensitive?: boolean; description?: string | null },
        Partial<{ module: string; action: string; key: string; is_sensitive: boolean; description: string | null }>
      >;
      role_permissions: Table<
        { role_id: string; permission_id: string; allowed: boolean; scope: PermissionScope },
        { role_id: string; permission_id: string; allowed?: boolean; scope?: PermissionScope },
        Partial<{ allowed: boolean; scope: PermissionScope }>
      >;
      event_members: Table<
        {
          id: string;
          event_id: string;
          user_id: string;
          role_id: string;
          pole: TeamPole | null;
          status: MemberStatus;
          invited_by: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          event_id: string;
          user_id: string;
          role_id: string;
          pole?: TeamPole | null;
          status?: MemberStatus;
          invited_by?: string | null;
        },
        Partial<{ role_id: string; pole: TeamPole | null; status: MemberStatus }>
      >;
      user_permission_overrides: Table<
        {
          id: string;
          event_id: string;
          user_id: string;
          permission_id: string;
          allowed: boolean;
          scope: PermissionScope | null;
          resource_type: string | null;
          resource_id: string | null;
          granted_by: string | null;
          expires_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          user_id: string;
          permission_id: string;
          allowed?: boolean;
          scope?: PermissionScope | null;
          resource_type?: string | null;
          resource_id?: string | null;
          granted_by?: string | null;
          expires_at?: string | null;
        },
        Partial<{ allowed: boolean; scope: PermissionScope | null; expires_at: string | null }>
      >;
      access_requests: Table<
        {
          id: string;
          event_id: string;
          user_id: string;
          resource_type: string;
          resource_id: string | null;
          permission_requested: string;
          reason: string | null;
          status: AccessRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          expires_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          user_id: string;
          resource_type: string;
          resource_id?: string | null;
          permission_requested: string;
          reason?: string | null;
          status?: AccessRequestStatus;
        },
        Partial<{
          status: AccessRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          expires_at: string | null;
        }>
      >;
      partners: Table<
        {
          id: string;
          event_id: string;
          company_name: string;
          logo_url: string | null;
          sector: string | null;
          website: string | null;
          address: string | null;
          contact_name: string | null;
          contact_role: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          source: string | null;
          owner_id: string | null;
          assigned_team_member_id: string | null;
          priority: PartnerPriority;
          status: PartnerStatus;
          contribution_type: ContributionType | null;
          next_action: string | null;
          next_followup_date: string | null;
          notes: string | null;
          counterparts_proposed: string | null;
          counterparts_validated: string | null;
          signed_at: string | null;
          tags: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          company_name: string;
          logo_url?: string | null;
          sector?: string | null;
          website?: string | null;
          address?: string | null;
          contact_name?: string | null;
          contact_role?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          source?: string | null;
          owner_id?: string | null;
          assigned_team_member_id?: string | null;
          priority?: PartnerPriority;
          status?: PartnerStatus;
          contribution_type?: ContributionType | null;
          next_action?: string | null;
          next_followup_date?: string | null;
          notes?: string | null;
          counterparts_proposed?: string | null;
          counterparts_validated?: string | null;
          signed_at?: string | null;
          tags?: string[];
          created_by?: string | null;
        },
        Partial<{
          company_name: string;
          logo_url: string | null;
          sector: string | null;
          website: string | null;
          address: string | null;
          contact_name: string | null;
          contact_role: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          source: string | null;
          owner_id: string | null;
          assigned_team_member_id: string | null;
          priority: PartnerPriority;
          status: PartnerStatus;
          contribution_type: ContributionType | null;
          next_action: string | null;
          next_followup_date: string | null;
          notes: string | null;
          counterparts_proposed: string | null;
          counterparts_validated: string | null;
          signed_at: string | null;
          tags: string[];
          deleted_at: string | null;
        }>
      >;
      partner_amounts: Table<
        {
          partner_id: string;
          amount_expected: number | null;
          amount_proposed: number | null;
          amount_confirmed: number | null;
          updated_at: string;
        },
        { partner_id: string; amount_expected?: number | null; amount_proposed?: number | null; amount_confirmed?: number | null },
        Partial<{ amount_expected: number | null; amount_proposed: number | null; amount_confirmed: number | null }>
      >;
      partner_confidential_notes: Table<
        { partner_id: string; notes: string | null; updated_at: string },
        { partner_id: string; notes?: string | null },
        Partial<{ notes: string | null }>
      >;
      partner_contacts: Table<
        {
          id: string;
          partner_id: string;
          name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          is_primary: boolean;
          created_at: string;
        },
        { id?: string; partner_id: string; name: string; role?: string | null; email?: string | null; phone?: string | null; is_primary?: boolean },
        Partial<{ name: string; role: string | null; email: string | null; phone: string | null; is_primary: boolean }>
      >;
      partner_interactions: Table<
        {
          id: string;
          event_id: string;
          partner_id: string;
          type: InteractionType;
          summary: string;
          user_id: string | null;
          attachment_document_id: string | null;
          next_action: string | null;
          next_followup_date: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          partner_id: string;
          type: InteractionType;
          summary: string;
          user_id?: string | null;
          attachment_document_id?: string | null;
          next_action?: string | null;
          next_followup_date?: string | null;
          created_at?: string;
        },
        Record<string, never>
      >;
      partner_followups: Table<
        {
          id: string;
          event_id: string;
          partner_id: string;
          due_date: string;
          status: FollowupStatus;
          note: string | null;
          assigned_to: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          partner_id: string;
          due_date: string;
          status?: FollowupStatus;
          note?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
        },
        Partial<{ due_date: string; status: FollowupStatus; note: string | null; assigned_to: string | null; completed_at: string | null }>
      >;
      partner_document_sends: Table<
        {
          id: string;
          event_id: string;
          partner_id: string;
          document_id: string | null;
          document_type: string;
          recipient_email: string;
          subject: string;
          message: string | null;
          status: DocumentSendStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          event_id: string;
          partner_id: string;
          document_id?: string | null;
          document_type: string;
          recipient_email: string;
          subject: string;
          message?: string | null;
          status?: DocumentSendStatus;
          created_by?: string | null;
        },
        Partial<{ status: DocumentSendStatus; message: string | null }>
      >;
      speakers: Table<
        {
          id: string;
          event_id: string;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          city: string | null;
          profession: string | null;
          company: string | null;
          bio: string | null;
          social_links: Json;
          proposed_topic: string | null;
          talk_title: string | null;
          talk_summary: string | null;
          talk_angle: string | null;
          duration_minutes: number | null;
          owner_id: string | null;
          status: SpeakerStatus;
          availability: string | null;
          constraints: string | null;
          technical_needs: string | null;
          accessibility_needs: string | null;
          transport: string | null;
          accommodation: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          first_name: string;
          last_name: string;
          photo_url?: string | null;
          city?: string | null;
          profession?: string | null;
          company?: string | null;
          bio?: string | null;
          social_links?: Json;
          proposed_topic?: string | null;
          talk_title?: string | null;
          talk_summary?: string | null;
          talk_angle?: string | null;
          duration_minutes?: number | null;
          owner_id?: string | null;
          status?: SpeakerStatus;
          availability?: string | null;
          constraints?: string | null;
          technical_needs?: string | null;
          accessibility_needs?: string | null;
          transport?: string | null;
          accommodation?: string | null;
          notes?: string | null;
          created_by?: string | null;
        },
        Partial<{
          first_name: string;
          last_name: string;
          photo_url: string | null;
          city: string | null;
          profession: string | null;
          company: string | null;
          bio: string | null;
          social_links: Json;
          proposed_topic: string | null;
          talk_title: string | null;
          talk_summary: string | null;
          talk_angle: string | null;
          duration_minutes: number | null;
          owner_id: string | null;
          status: SpeakerStatus;
          availability: string | null;
          constraints: string | null;
          technical_needs: string | null;
          accessibility_needs: string | null;
          transport: string | null;
          accommodation: string | null;
          notes: string | null;
          deleted_at: string | null;
        }>
      >;
      speaker_private: Table<
        { speaker_id: string; email: string | null; phone: string | null; confidential_notes: string | null; updated_at: string },
        { speaker_id: string; email?: string | null; phone?: string | null; confidential_notes?: string | null },
        Partial<{ email: string | null; phone: string | null; confidential_notes: string | null }>
      >;
      speaker_checklist_items: Table<
        { id: string; speaker_id: string; item_key: SpeakerChecklistKey; is_done: boolean; done_at: string | null; done_by: string | null },
        { id?: string; speaker_id: string; item_key: SpeakerChecklistKey; is_done?: boolean; done_at?: string | null; done_by?: string | null },
        Partial<{ is_done: boolean; done_at: string | null; done_by: string | null }>
      >;
      speaker_timeline: Table<
        { id: string; speaker_id: string; event_type: string; note: string | null; user_id: string | null; created_at: string },
        { id?: string; speaker_id: string; event_type: string; note?: string | null; user_id?: string | null },
        Record<string, never>
      >;
      team_members: Table<
        {
          id: string;
          event_id: string;
          profile_id: string | null;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          role_label: string | null;
          pole: TeamPole;
          status: MemberStatus;
          arrival_date: string | null;
          availability: string | null;
          workload_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          profile_id?: string | null;
          first_name: string;
          last_name: string;
          photo_url?: string | null;
          role_label?: string | null;
          pole: TeamPole;
          status?: MemberStatus;
          arrival_date?: string | null;
          availability?: string | null;
          workload_notes?: string | null;
          created_by?: string | null;
        },
        Partial<{
          profile_id: string | null;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          role_label: string | null;
          pole: TeamPole;
          status: MemberStatus;
          arrival_date: string | null;
          availability: string | null;
          workload_notes: string | null;
          deleted_at: string | null;
        }>
      >;
      team_member_private: Table<
        { team_member_id: string; email: string | null; phone: string | null; admin_confidential_notes: string | null; updated_at: string },
        { team_member_id: string; email?: string | null; phone?: string | null; admin_confidential_notes?: string | null },
        Partial<{ email: string | null; phone: string | null; admin_confidential_notes: string | null }>
      >;
      tasks: Table<
        {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          module_ref: TaskModuleRef;
          partner_id: string | null;
          speaker_id: string | null;
          owner_id: string | null;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          module_ref?: TaskModuleRef;
          partner_id?: string | null;
          speaker_id?: string | null;
          owner_id?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          created_by?: string | null;
        },
        Partial<{
          title: string;
          description: string | null;
          module_ref: TaskModuleRef;
          partner_id: string | null;
          speaker_id: string | null;
          owner_id: string | null;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          deleted_at: string | null;
        }>
      >;
      task_assignees: Table<
        { task_id: string; user_id: string },
        { task_id: string; user_id: string },
        Record<string, never>
      >;
      task_checklist_items: Table<
        { id: string; task_id: string; label: string; is_done: boolean; position: number },
        { id?: string; task_id: string; label: string; is_done?: boolean; position?: number },
        Partial<{ label: string; is_done: boolean; position: number }>
      >;
      task_comments: Table<
        { id: string; task_id: string; user_id: string | null; body: string; created_at: string },
        { id?: string; task_id: string; user_id?: string | null; body: string },
        Record<string, never>
      >;
      budget_categories: Table<
        {
          id: string;
          event_id: string;
          name: string;
          kind: TransactionType;
          forecast_amount: number;
          parent_category_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_id: string;
          name: string;
          kind: TransactionType;
          forecast_amount?: number;
          parent_category_id?: string | null;
        },
        Partial<{ name: string; kind: TransactionType; forecast_amount: number; parent_category_id: string | null }>
      >;
      financial_transactions: Table<
        {
          id: string;
          event_id: string;
          title: string;
          type: TransactionType;
          category_id: string | null;
          amount_ht: number;
          tva_rate: number;
          amount_ttc: number;
          partner_id: string | null;
          supplier_name: string | null;
          transaction_date: string;
          due_date: string | null;
          status: TransactionStatus;
          payment_method: PaymentMethod | null;
          invoice_id: string | null;
          receipt_document_id: string | null;
          confidential_comment: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          certainty: Certainty;
        },
        {
          id?: string;
          event_id: string;
          title: string;
          type: TransactionType;
          category_id?: string | null;
          amount_ht: number;
          tva_rate?: number;
          amount_ttc: number;
          partner_id?: string | null;
          supplier_name?: string | null;
          transaction_date: string;
          due_date?: string | null;
          status?: TransactionStatus;
          payment_method?: PaymentMethod | null;
          invoice_id?: string | null;
          receipt_document_id?: string | null;
          confidential_comment?: string | null;
          created_by?: string | null;
          certainty?: Certainty;
        },
        Partial<{
          title: string;
          type: TransactionType;
          category_id: string | null;
          amount_ht: number;
          tva_rate: number;
          amount_ttc: number;
          supplier_name: string | null;
          transaction_date: string;
          due_date: string | null;
          status: TransactionStatus;
          payment_method: PaymentMethod | null;
          invoice_id: string | null;
          receipt_document_id: string | null;
          confidential_comment: string | null;
          certainty: Certainty;
        }>
      >;
      invoices: Table<
        {
          id: string;
          event_id: string;
          number: string;
          title: string;
          type: InvoiceType;
          document_type: DocumentType;
          partner_id: string | null;
          supplier_name: string | null;
          category_id: string | null;
          amount: number;
          tva: number;
          issue_date: string;
          due_date: string | null;
          status: InvoiceStatus;
          paid_at: string | null;
          file_document_id: string | null;
          confidential_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          // Auto-generated by the assign_invoice_number trigger when omitted
          // or blank — never pass a value when creating an invoice.
          number?: string;
          title: string;
          type: InvoiceType;
          document_type?: DocumentType;
          partner_id?: string | null;
          supplier_name?: string | null;
          category_id?: string | null;
          amount: number;
          tva?: number;
          issue_date: string;
          due_date?: string | null;
          status?: InvoiceStatus;
          paid_at?: string | null;
          file_document_id?: string | null;
          confidential_notes?: string | null;
          created_by?: string | null;
        },
        Partial<{
          title: string;
          type: InvoiceType;
          document_type: DocumentType;
          partner_id: string | null;
          supplier_name: string | null;
          category_id: string | null;
          amount: number;
          tva: number;
          issue_date: string;
          due_date: string | null;
          status: InvoiceStatus;
          paid_at: string | null;
          file_document_id: string | null;
          confidential_notes: string | null;
          deleted_at: string | null;
        }>
      >;
      invoice_payments: Table<
        {
          id: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: PaymentMethod | null;
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method?: PaymentMethod | null;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
        },
        Partial<{ amount: number; payment_date: string; payment_method: PaymentMethod | null; reference: string | null; notes: string | null }>
      >;
      // Read-only view (invoice_id, total_due, total_paid, remaining) — the
      // only correct source for "paid so far" on an invoice, derived from
      // invoice_payments. Never insert/update through it.
      invoice_effective_amounts: Table<
        { invoice_id: string; total_due: number; total_paid: number; remaining: number },
        never,
        never
      >;
      subsidies: Table<
        {
          id: string;
          event_id: string;
          name: string;
          grantor: string | null;
          amount_requested: number | null;
          amount_granted: number | null;
          amount_received: number;
          status: SubsidyStatus;
          notes: string | null;
          document_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          name: string;
          grantor?: string | null;
          amount_requested?: number | null;
          amount_granted?: number | null;
          amount_received?: number;
          status?: SubsidyStatus;
          notes?: string | null;
          document_id?: string | null;
          created_by?: string | null;
        },
        Partial<{
          name: string;
          grantor: string | null;
          amount_requested: number | null;
          amount_granted: number | null;
          amount_received: number;
          status: SubsidyStatus;
          notes: string | null;
          document_id: string | null;
          deleted_at: string | null;
        }>
      >;
      documents: Table<
        {
          id: string;
          event_id: string;
          name: string;
          category: string;
          storage_path: string;
          version: number;
          file_size: number | null;
          mime_type: string | null;
          author_id: string | null;
          partner_id: string | null;
          speaker_id: string | null;
          task_id: string | null;
          confidentiality_level: DocumentConfidentiality;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          event_id: string;
          name: string;
          category: string;
          storage_path: string;
          version?: number;
          file_size?: number | null;
          mime_type?: string | null;
          author_id?: string | null;
          partner_id?: string | null;
          speaker_id?: string | null;
          task_id?: string | null;
          confidentiality_level?: DocumentConfidentiality;
          expires_at?: string | null;
        },
        Partial<{
          name: string;
          category: string;
          version: number;
          confidentiality_level: DocumentConfidentiality;
          expires_at: string | null;
          deleted_at: string | null;
        }>
      >;
      document_access: Table<
        { document_id: string; user_id: string | null; pole: TeamPole | null; granted_by: string | null; created_at: string },
        { document_id: string; user_id?: string | null; pole?: TeamPole | null; granted_by?: string | null },
        Record<string, never>
      >;
      document_downloads: Table<
        { id: string; document_id: string; user_id: string | null; downloaded_at: string },
        { id?: string; document_id: string; user_id?: string | null },
        Record<string, never>
      >;
      calendar_items: Table<
        {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          type: CalendarItemType;
          start_at: string;
          end_at: string | null;
          all_day: boolean;
          partner_id: string | null;
          speaker_id: string | null;
          task_id: string | null;
          owner_id: string | null;
          visibility: CalendarVisibility;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          type: CalendarItemType;
          start_at: string;
          end_at?: string | null;
          all_day?: boolean;
          partner_id?: string | null;
          speaker_id?: string | null;
          task_id?: string | null;
          owner_id?: string | null;
          visibility?: CalendarVisibility;
          created_by?: string | null;
        },
        Partial<{
          title: string;
          description: string | null;
          type: CalendarItemType;
          start_at: string;
          end_at: string | null;
          all_day: boolean;
          owner_id: string | null;
          visibility: CalendarVisibility;
        }>
      >;
      calendar_item_attendees: Table<
        { calendar_item_id: string; user_id: string },
        { calendar_item_id: string; user_id: string },
        Record<string, never>
      >;
      notifications: Table<
        {
          id: string;
          user_id: string;
          event_id: string | null;
          type: string;
          title: string;
          body: string | null;
          link_url: string | null;
          related_resource_type: string | null;
          related_resource_id: string | null;
          is_read: boolean;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          event_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          link_url?: string | null;
          related_resource_type?: string | null;
          related_resource_id?: string | null;
          is_read?: boolean;
        },
        Partial<{ is_read: boolean }>
      >;
      activity_logs: Table<
        {
          id: string;
          event_id: string | null;
          user_id: string | null;
          action: ActivityAction;
          module: string;
          resource_type: string | null;
          resource_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          created_at: string;
        },
        Record<string, never>,
        Record<string, never>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      has_permission: {
        Args: { p_user: string; p_event: string; p_module: string; p_action: string };
        Returns: boolean;
      };
      get_scope: {
        Args: { p_user: string; p_event: string; p_module: string; p_action?: string };
        Returns: PermissionScope;
      };
      is_super_admin: { Args: { p_user: string }; Returns: boolean };
      get_effective_permissions: {
        Args: { p_user: string; p_event: string };
        Returns: { module: string; action: string; allowed: boolean; scope: PermissionScope }[];
      };
      can_view_document: { Args: { p_user: string; p_document_id: string }; Returns: boolean };
      can_edit_document: { Args: { p_user: string; p_document_id: string }; Returns: boolean };
      generate_due_notifications: { Args: Record<string, never>; Returns: undefined };
      archive_team_member: { Args: { p_id: string }; Returns: undefined };
      create_document: {
        Args: {
          p_event_id: string;
          p_author_id: string;
          p_storage_path: string;
          p_file_size: number | null;
          p_mime_type: string | null;
          p_name: string;
          p_category: string;
          p_confidentiality_level: DocumentConfidentiality;
          p_partner_id?: string | null;
          p_speaker_id?: string | null;
          p_task_id?: string | null;
        };
        Returns: string;
      };
      next_document_number: { Args: { p_event_id: string; p_document_type: string }; Returns: string };
    };
    Enums: {
      event_status: EventStatus;
      member_status: MemberStatus;
      permission_scope: PermissionScope;
      access_request_status: AccessRequestStatus;
      team_pole: TeamPole;
      partner_priority: PartnerPriority;
      partner_status: PartnerStatus;
      contribution_type: ContributionType;
      interaction_type: InteractionType;
      followup_status: FollowupStatus;
      document_send_status: DocumentSendStatus;
      speaker_status: SpeakerStatus;
      speaker_checklist_key: SpeakerChecklistKey;
      task_module_ref: TaskModuleRef;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      payment_method: PaymentMethod;
      invoice_type: InvoiceType;
      invoice_status: InvoiceStatus;
      document_confidentiality: DocumentConfidentiality;
      calendar_item_type: CalendarItemType;
      calendar_visibility: CalendarVisibility;
      activity_action: ActivityAction;
      subsidy_status: SubsidyStatus;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
