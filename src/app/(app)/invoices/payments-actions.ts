"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoicePaymentSchema } from "@/lib/validations/invoices";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createInvoicePaymentAction(invoiceId: string, formData: FormData): Promise<ActionState> {
  const parsed = invoicePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    created_by: user.id,
    ...parsed.data,
  });
  if (error) return { error: "Impossible d’enregistrer le paiement (" + error.message + ")" };

  revalidatePath("/invoices");
  return { success: true };
}

export async function deleteInvoicePaymentAction(paymentId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoice_payments").delete().eq("id", paymentId);
  if (error) return { error: "Suppression refusée : " + error.message };
  revalidatePath("/invoices");
  return { success: true };
}
