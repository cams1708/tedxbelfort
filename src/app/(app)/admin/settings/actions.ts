"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bankDetailsSchema, eventSettingsSchema } from "@/lib/validations/admin";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function updateEventSettingsAction(eventId: string, formData: FormData): Promise<ActionState> {
  const parsed = eventSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { event_date, ...rest } = parsed.data;
  const { error } = await supabase
    .from("events")
    .update({ event_date: event_date || null, ...rest })
    .eq("id", eventId);

  if (error) return { error: "Impossible d’enregistrer les paramètres (" + error.message + ")" };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateBankDetailsAction(eventId: string, formData: FormData): Promise<ActionState> {
  const parsed = bankDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("event_bank_details").upsert({ event_id: eventId, ...parsed.data });
  if (error) return { error: "Impossible d’enregistrer (" + error.message + ")" };

  revalidatePath("/admin/settings");
  return { success: true };
}
