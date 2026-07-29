"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { invoiceFormSchema } from "@/lib/validations/invoices";
import { uploadAndLinkDocument } from "@/lib/storage/documents";

export interface ActionState {
  error?: string;
  success?: boolean;
}

async function attachInvoiceFile(
  eventId: string,
  invoiceNumber: string,
  formData: FormData,
): Promise<{ documentId?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: allowed } = await supabase.rpc("has_permission", {
    p_user: user.id,
    p_event: eventId,
    p_module: "documents",
    p_action: "create",
  });
  if (!allowed) return { error: "Vous n’avez pas la permission de joindre un document." };

  const result = await uploadAndLinkDocument({
    eventId,
    file,
    name: `Facture ${invoiceNumber}`,
    category: "invoices",
    confidentialityLevel: "confidential",
  });
  if ("error" in result) return { error: result.error };
  return { documentId: result.documentId };
}

export async function createInvoiceAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = invoiceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const attachment = await attachInvoiceFile(eventId, parsed.data.number, formData);
  if (attachment.error) return { error: attachment.error };

  const supabase = await createClient();
  const { due_date, category_id, ...rest } = parsed.data;
  const { error } = await supabase.from("invoices").insert({
    event_id: eventId,
    due_date: due_date || null,
    category_id: category_id || null,
    file_document_id: attachment.documentId ?? null,
    ...rest,
  });
  if (error) return { error: "Impossible de créer la facture (" + error.message + ")" };

  revalidatePath("/invoices");
  return { success: true };
}

export async function updateInvoiceAction(invoiceId: string, formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = invoiceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const attachment = await attachInvoiceFile(eventId, parsed.data.number, formData);
  if (attachment.error) return { error: attachment.error };

  const supabase = await createClient();
  const { due_date, category_id, ...rest } = parsed.data;
  const { error } = await supabase
    .from("invoices")
    .update({
      due_date: due_date || null,
      category_id: category_id || null,
      ...(attachment.documentId ? { file_document_id: attachment.documentId } : {}),
      ...rest,
    })
    .eq("id", invoiceId);
  if (error) return { error: "Impossible de modifier la facture (" + error.message + ")" };

  revalidatePath("/invoices");
  return { success: true };
}

export async function archiveInvoiceAction(invoiceId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ deleted_at: new Date().toISOString() }).eq("id", invoiceId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/invoices");
  return { success: true };
}

export async function getInvoiceFileUrlAction(documentId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: canView } = await supabase.rpc("can_view_document", {
    p_user: user.id,
    p_document_id: documentId,
  });
  if (!canView) return { error: "Accès non autorisé à ce document." };

  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", documentId).single();
  if (!doc) return { error: "Document introuvable." };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60 * 5);
  if (signError || !signed) return { error: "Impossible de générer le lien de téléchargement." };

  await supabase.from("document_downloads").insert({ document_id: documentId, user_id: user.id });

  return { url: signed.signedUrl };
}
