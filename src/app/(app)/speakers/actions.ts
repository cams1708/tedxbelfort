"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { speakerFormSchema, speakerPrivateSchema, speakerTimelineSchema } from "@/lib/validations/speakers";
import type { SpeakerChecklistKey, SpeakerStatus } from "@/types/database.types";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createSpeakerAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = speakerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { owner_id, ...rest } = parsed.data;

  const { error } = await supabase.from("speakers").insert({
    event_id: eventId,
    owner_id: owner_id || null,
    ...rest,
  });

  if (error) return { error: "Impossible de créer le speaker (" + error.message + ")" };

  revalidatePath("/speakers");
  return { success: true };
}

export async function updateSpeakerAction(speakerId: string, formData: FormData): Promise<ActionState> {
  const parsed = speakerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { owner_id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("speakers")
    .update({ owner_id: owner_id || null, ...rest })
    .eq("id", speakerId);

  if (error) return { error: "Impossible de modifier le speaker (" + error.message + ")" };

  revalidatePath("/speakers");
  revalidatePath(`/speakers/${speakerId}`);
  return { success: true };
}

export async function updateSpeakerStatusAction(speakerId: string, status: SpeakerStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("speakers").update({ status }).eq("id", speakerId);
  if (error) return { error: "Changement de statut refusé : " + error.message };
  revalidatePath("/speakers");
  revalidatePath(`/speakers/${speakerId}`);
  return { success: true };
}

export async function archiveSpeakerAction(speakerId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("speakers").update({ deleted_at: new Date().toISOString() }).eq("id", speakerId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/speakers");
  return { success: true };
}

export async function updateSpeakerPrivateAction(speakerId: string, formData: FormData): Promise<ActionState> {
  const parsed = speakerPrivateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("speaker_private").upsert({
    speaker_id: speakerId,
    email: parsed.data.email || null,
    phone: parsed.data.phone ?? null,
    confidential_notes: parsed.data.confidential_notes ?? null,
  });
  if (error) return { error: "Impossible d’enregistrer (" + error.message + ")" };

  revalidatePath(`/speakers/${speakerId}`);
  return { success: true };
}

export async function toggleChecklistItemAction(
  speakerId: string,
  itemKey: SpeakerChecklistKey,
  isDone: boolean,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("speaker_checklist_items").upsert(
    {
      speaker_id: speakerId,
      item_key: itemKey,
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
      done_by: isDone ? (user?.id ?? null) : null,
    },
    { onConflict: "speaker_id,item_key" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/speakers/${speakerId}`);
  return { success: true };
}

export async function addTimelineEntryAction(speakerId: string, formData: FormData): Promise<ActionState> {
  const parsed = speakerTimelineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("speaker_timeline").insert({
    speaker_id: speakerId,
    user_id: user?.id ?? null,
    ...parsed.data,
  });
  if (error) return { error: "Impossible d’ajouter l’entrée (" + error.message + ")" };

  revalidatePath(`/speakers/${speakerId}`);
  return { success: true };
}
