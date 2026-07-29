"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { calendarItemSchema } from "@/lib/validations/calendar";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createCalendarItemAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = calendarItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("calendar_items").insert({
    event_id: eventId,
    owner_id: user?.id ?? null,
    created_by: user?.id ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    type: parsed.data.type,
    start_at: parsed.data.start_at,
    end_at: parsed.data.end_at ?? null,
    all_day: parsed.data.all_day ?? false,
    visibility: parsed.data.visibility,
  });

  if (error) return { error: "Impossible de créer l’événement (" + error.message + ")" };

  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteCalendarItemAction(itemId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_items").delete().eq("id", itemId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/calendar");
  return { success: true };
}
