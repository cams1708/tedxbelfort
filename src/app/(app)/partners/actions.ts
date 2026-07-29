"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import {
  documentSendSchema,
  followupSchema,
  interactionSchema,
  partnerAmountsSchema,
  partnerConfidentialNotesSchema,
  partnerFormSchema,
} from "@/lib/validations/partners";
import type { PartnerStatus } from "@/types/database.types";
import { sendEmail } from "@/lib/email/resend";

export interface ActionState {
  error?: string;
  success?: boolean;
}

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createPartnerAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = partnerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { tags, contact_email, owner_id, next_followup_date, ...rest } = parsed.data;

  const { error } = await supabase.from("partners").insert({
    event_id: eventId,
    ...rest,
    contact_email: contact_email || null,
    owner_id: owner_id || null,
    next_followup_date: next_followup_date || null,
    tags: parseTags(tags),
  });

  if (error) return { error: "Impossible de créer le partenaire (" + error.message + ")" };

  revalidatePath("/partners");
  return { success: true };
}

export async function updatePartnerAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const parsed = partnerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { tags, contact_email, owner_id, next_followup_date, ...rest } = parsed.data;

  const { error } = await supabase
    .from("partners")
    .update({
      ...rest,
      contact_email: contact_email || null,
      owner_id: owner_id || null,
      next_followup_date: next_followup_date || null,
      tags: parseTags(tags),
    })
    .eq("id", partnerId);

  if (error) return { error: "Impossible de modifier le partenaire (" + error.message + ")" };

  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function updatePartnerStatusAction(partnerId: string, status: PartnerStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("partners").update({ status }).eq("id", partnerId);
  if (error) return { error: "Changement de statut refusé : " + error.message };
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function archivePartnerAction(partnerId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("partners").update({ deleted_at: new Date().toISOString() }).eq("id", partnerId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/partners");
  return { success: true };
}

export async function updatePartnerAmountsAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const parsed = partnerAmountsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("partner_amounts").upsert({ partner_id: partnerId, ...parsed.data });
  if (error) return { error: "Impossible d’enregistrer les montants (" + error.message + ")" };

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function updatePartnerConfidentialNotesAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const parsed = partnerConfidentialNotesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("partner_confidential_notes")
    .upsert({ partner_id: partnerId, notes: parsed.data.notes ?? null });
  if (error) return { error: "Impossible d’enregistrer les notes (" + error.message + ")" };

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function addInteractionAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = interactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { next_followup_date, ...rest } = parsed.data;
  const { error } = await supabase.from("partner_interactions").insert({
    event_id: eventId,
    partner_id: partnerId,
    user_id: user?.id ?? null,
    next_followup_date: next_followup_date || null,
    ...rest,
  });

  if (error) return { error: "Impossible d’ajouter l’échange (" + error.message + ")" };

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function createFollowupAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = followupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { assigned_to, ...rest } = parsed.data;
  const { error } = await supabase.from("partner_followups").insert({
    event_id: eventId,
    partner_id: partnerId,
    assigned_to: assigned_to || null,
    ...rest,
  });

  if (error) return { error: "Impossible de créer la relance (" + error.message + ")" };

  revalidatePath(`/partners/${partnerId}`);
  revalidatePath("/followups");
  return { success: true };
}

export async function prepareDocumentSendAction(partnerId: string, formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = documentSendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { document_id, ...rest } = parsed.data;
  const { error } = await supabase.from("partner_document_sends").insert({
    event_id: eventId,
    partner_id: partnerId,
    document_id: document_id || null,
    status: "prepared",
    ...rest,
  });

  if (error) return { error: "Impossible de préparer l’envoi (" + error.message + ")" };

  revalidatePath(`/partners/${partnerId}`);
  return { success: true };
}

export async function sendPreparedDocumentAction(sendId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: send } = await supabase.from("partner_document_sends").select("*").eq("id", sendId).single();
  if (!send) return { error: "Envoi introuvable." };

  let downloadUrl: string | null = null;
  if (send.document_id) {
    const { data: canView } = await supabase.rpc("can_view_document", {
      p_user: user.id,
      p_document_id: send.document_id,
    });
    if (!canView) return { error: "Vous n’avez pas accès au document lié à cet envoi." };

    const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", send.document_id).single();
    if (doc) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = createAdminClient();
      const { data: signed } = await admin.storage.from("documents").createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7);
      downloadUrl = signed?.signedUrl ?? null;
    }
  }

  const html = `
    <div style="font-family: Inter, Helvetica, Arial, sans-serif; color: #111;">
      <p>${(send.message ?? "").replace(/\n/g, "<br/>")}</p>
      ${downloadUrl ? `<p><a href="${downloadUrl}">Télécharger le document (${send.document_type})</a></p>` : ""}
      <p style="color:#888; font-size: 12px;">TEDx Belfort</p>
    </div>
  `;

  const result = await sendEmail({ to: send.recipient_email, subject: send.subject, html });
  if ("error" in result) return { error: result.error };

  const { error } = await supabase.from("partner_document_sends").update({ status: "sent" }).eq("id", sendId);
  if (error) return { error: error.message };

  revalidatePath(`/partners/${send.partner_id}`);
  return { success: true };
}

export async function completeFollowupAction(followupId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("partner_followups")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", followupId);
  if (error) return { error: error.message };
  revalidatePath("/followups");
  return { success: true };
}
