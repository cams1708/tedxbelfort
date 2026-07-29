"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { taskCommentSchema, taskFormSchema } from "@/lib/validations/tasks";
import type { TaskStatus } from "@/types/database.types";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createTaskAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { owner_id, due_date, ...rest } = parsed.data;
  const { error } = await supabase.from("tasks").insert({
    event_id: eventId,
    owner_id: owner_id || null,
    due_date: due_date || null,
    ...rest,
  });

  if (error) return { error: "Impossible de créer la tâche (" + error.message + ")" };

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskAction(taskId: string, formData: FormData): Promise<ActionState> {
  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { owner_id, due_date, ...rest } = parsed.data;
  const { error } = await supabase
    .from("tasks")
    .update({ owner_id: owner_id || null, due_date: due_date || null, ...rest })
    .eq("id", taskId);

  if (error) return { error: "Impossible de modifier la tâche (" + error.message + ")" };

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) return { error: "Changement de statut refusé : " + error.message };
  revalidatePath("/tasks");
  return { success: true };
}

export async function archiveTaskAction(taskId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", taskId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/tasks");
  return { success: true };
}

export async function addTaskCommentAction(taskId: string, formData: FormData): Promise<ActionState> {
  const parsed = taskCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user?.id ?? null,
    body: parsed.data.body,
  });
  if (error) return { error: "Impossible d’ajouter le commentaire (" + error.message + ")" };

  revalidatePath("/tasks");
  return { success: true };
}

export async function toggleTaskAssigneeAction(taskId: string, userId: string, assign: boolean): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = assign
    ? await supabase.from("task_assignees").insert({ task_id: taskId, user_id: userId })
    : await supabase.from("task_assignees").delete().eq("task_id", taskId).eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}
