"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";

export interface RequestAccessInput {
  resourceType: string;
  resourceId?: string;
  permissionRequested: string;
  reason?: string;
}

export async function requestAccessAction(input: RequestAccessInput): Promise<{ error?: string; success?: boolean }> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.from("access_requests").insert({
    event_id: eventId,
    user_id: user.id,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    permission_requested: input.permissionRequested,
    reason: input.reason ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
