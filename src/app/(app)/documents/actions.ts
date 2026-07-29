"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { documentUploadSchema } from "@/lib/validations/documents";
import type { TeamPole } from "@/types/database.types";

export interface ActionState {
  error?: string;
  success?: boolean;
}

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes
const BUCKET = "documents";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier sélectionné." };

  const parsed = documentUploadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // Explicit re-check: the actual storage write happens via the admin
  // client below (the bucket has no RLS policies for authenticated users),
  // so authorization must be verified here in application code first.
  const { data: allowed } = await supabase.rpc("has_permission", {
    p_user: user.id,
    p_event: eventId,
    p_module: "documents",
    p_action: "create",
  });
  if (!allowed) return { error: "Vous n’avez pas la permission d’ajouter un document." };

  const admin = createAdminClient();
  const path = `${eventId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return { error: "Échec de l’envoi du fichier (" + uploadError.message + ")" };

  const { partner_id, speaker_id, task_id, expires_at, ...rest } = parsed.data;
  const { error: insertError } = await supabase.from("documents").insert({
    event_id: eventId,
    author_id: user.id,
    storage_path: path,
    file_size: file.size,
    mime_type: file.type || null,
    partner_id: partner_id || null,
    speaker_id: speaker_id || null,
    task_id: task_id || null,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    ...rest,
  });

  if (insertError) {
    await admin.storage.from(BUCKET).remove([path]);
    return { error: "Impossible d’enregistrer le document (" + insertError.message + ")" };
  }

  revalidatePath("/documents");
  return { success: true };
}

export async function archiveDocumentAction(documentId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", documentId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/documents");
  return { success: true };
}

export async function getSignedDownloadUrlAction(
  documentId: string,
): Promise<{ url?: string; error?: string }> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

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

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) return { error: "Impossible de générer le lien de téléchargement." };

  await supabase.from("document_downloads").insert({ document_id: documentId, user_id: user.id });

  return { url: signed.signedUrl };
}

export async function addDocumentAccessAction(
  documentId: string,
  grant: { userId?: string; pole?: TeamPole },
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("document_access").insert({
    document_id: documentId,
    user_id: grant.userId ?? null,
    pole: grant.pole ?? null,
    granted_by: user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { success: true };
}
