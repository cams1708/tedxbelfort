"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { subsidyFormSchema } from "@/lib/validations/subsidies";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createSubsidyAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = subsidyFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("subsidies").insert({ event_id: eventId, ...parsed.data });
  if (error) return { error: "Impossible de créer la subvention (" + error.message + ")" };

  revalidatePath("/subsidies");
  return { success: true };
}

export async function updateSubsidyAction(subsidyId: string, formData: FormData): Promise<ActionState> {
  const parsed = subsidyFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("subsidies").update(parsed.data).eq("id", subsidyId);
  if (error) return { error: "Impossible de modifier la subvention (" + error.message + ")" };

  revalidatePath("/subsidies");
  return { success: true };
}

export async function archiveSubsidyAction(subsidyId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subsidies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", subsidyId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/subsidies");
  return { success: true };
}
