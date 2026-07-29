import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const budgetCategorySchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  kind: z.enum(["revenue", "expense"]),
  forecast_amount: z.coerce.number().nonnegative(),
});

export const transactionSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum(["revenue", "expense"]),
  category_id: optionalText,
  amount_ht: z.coerce.number().nonnegative(),
  tva_rate: z.coerce.number().nonnegative().default(0),
  amount_ttc: z.coerce.number().nonnegative(),
  supplier_name: optionalText,
  transaction_date: z.string().trim().min(1, "Date requise"),
  due_date: optionalText,
  status: z.enum(["planned", "engaged", "invoiced", "paid", "overdue", "cancelled"]),
  payment_method: z.enum(["bank_transfer", "check", "cash", "card", "other"]).optional(),
  confidential_comment: optionalText,
});
