import "server-only";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { DocumentConfidentiality } from "@/types/database.types";

const BUCKET = "documents";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export interface UploadDocumentInput {
  eventId: string;
  file: File;
  name: string;
  category: string;
  confidentialityLevel: DocumentConfidentiality;
  partnerId?: string | null;
  speakerId?: string | null;
  taskId?: string | null;
}

/**
 * Uploads a file to the private `documents` storage bucket and creates the
 * matching `documents` metadata row. Shared between the Documents module and
 * any other feature that attaches a file to a record (e.g. invoices).
 * Requires the caller to have already verified `documents.create` on the
 * current user — this helper does not re-check permissions itself.
 */
export async function uploadAndLinkDocument(
  input: UploadDocumentInput,
): Promise<{ documentId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const admin = createAdminClient();
  const path = `${input.eventId}/${crypto.randomUUID()}-${sanitizeFilename(input.file.name)}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return { error: "Échec de l’envoi du fichier (" + uploadError.message + ")" };

  const { data: documentId, error: insertError } = await supabase.rpc("create_document", {
    p_event_id: input.eventId,
    p_author_id: user.id,
    p_storage_path: path,
    p_file_size: input.file.size,
    p_mime_type: input.file.type || null,
    p_name: input.name,
    p_category: input.category,
    p_confidentiality_level: input.confidentialityLevel,
    p_partner_id: input.partnerId ?? null,
    p_speaker_id: input.speakerId ?? null,
    p_task_id: input.taskId ?? null,
  });

  if (insertError || !documentId) {
    await admin.storage.from(BUCKET).remove([path]);
    return { error: "Impossible d’enregistrer le document (" + (insertError?.message ?? "erreur inconnue") + ")" };
  }

  return { documentId };
}
