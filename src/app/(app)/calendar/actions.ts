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

  const { data: item, error } = await supabase
    .from("calendar_items")
    .insert({
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
    })
    .select("id")
    .single();

  if (error || !item) return { error: "Impossible de créer l’événement (" + (error?.message ?? "erreur inconnue") + ")" };

  if (parsed.data.visibility === "assigned") {
    const attendeeIds = formData.getAll("attendee_ids").filter((id): id is string => typeof id === "string" && id.length > 0);
    if (attendeeIds.length > 0) {
      const { error: attendeeError } = await supabase
        .from("calendar_item_attendees")
        .insert(attendeeIds.map((userId) => ({ calendar_item_id: item.id, user_id: userId })));
      if (attendeeError) return { error: "Événement créé, mais impossible d’attribuer les personnes (" + attendeeError.message + ")" };
    }
  }

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
