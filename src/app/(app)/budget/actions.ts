"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { budgetCategorySchema, transactionSchema } from "@/lib/validations/budget";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createBudgetCategoryAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = budgetCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_categories").insert({ event_id: eventId, ...parsed.data });
  if (error) return { error: "Impossible de créer la catégorie (" + error.message + ")" };

  revalidatePath("/budget");
  return { success: true };
}

export async function createTransactionAction(formData: FormData): Promise<ActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { category_id, due_date, ...rest } = parsed.data;
  const { error } = await supabase.from("financial_transactions").insert({
    event_id: eventId,
    category_id: category_id || null,
    due_date: due_date || null,
    ...rest,
  });
  if (error) return { error: "Impossible de créer le mouvement (" + error.message + ")" };

  revalidatePath("/budget");
  return { success: true };
}

export async function updateTransactionAction(transactionId: string, formData: FormData): Promise<ActionState> {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { category_id, due_date, ...rest } = parsed.data;
  const { error } = await supabase
    .from("financial_transactions")
    .update({ category_id: category_id || null, due_date: due_date || null, ...rest })
    .eq("id", transactionId);
  if (error) return { error: "Impossible de modifier le mouvement (" + error.message + ")" };

  revalidatePath("/budget");
  return { success: true };
}

export async function deleteTransactionAction(transactionId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("financial_transactions").delete().eq("id", transactionId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/budget");
  return { success: true };
}
