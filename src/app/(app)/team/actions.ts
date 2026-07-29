"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { teamMemberFormSchema, teamMemberPrivateSchema } from "@/lib/validations/team";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createTeamMemberAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = teamMemberFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { arrival_date, profile_id, ...rest } = parsed.data;
  const { error } = await supabase.from("team_members").insert({
    event_id: eventId,
    arrival_date: arrival_date || null,
    profile_id: profile_id || null,
    ...rest,
  });

  if (error) return { error: "Impossible d’ajouter le membre (" + error.message + ")" };

  revalidatePath("/team");
  return { success: true };
}

export async function updateTeamMemberAction(memberId: string, formData: FormData): Promise<ActionState> {
  const parsed = teamMemberFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { arrival_date, profile_id, ...rest } = parsed.data;
  const { error } = await supabase
    .from("team_members")
    .update({ arrival_date: arrival_date || null, profile_id: profile_id || null, ...rest })
    .eq("id", memberId);

  if (error) return { error: "Impossible de modifier le membre (" + error.message + ")" };

  revalidatePath("/team");
  return { success: true };
}

export async function archiveTeamMemberAction(memberId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function updateTeamMemberPrivateAction(memberId: string, formData: FormData): Promise<ActionState> {
  const parsed = teamMemberPrivateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("team_member_private").upsert({
    team_member_id: memberId,
    email: parsed.data.email || null,
    phone: parsed.data.phone ?? null,
    admin_confidential_notes: parsed.data.admin_confidential_notes ?? null,
  });
  if (error) return { error: "Impossible d’enregistrer (" + error.message + ")" };

  revalidatePath("/team");
  return { success: true };
}
