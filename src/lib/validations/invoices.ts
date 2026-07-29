import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const invoiceFormSchema = z.object({
  number: z.string().trim().min(1, "Numéro requis"),
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum(["sent_to_partner", "received_from_supplier"]),
  supplier_name: optionalText,
  category_id: optionalText,
  amount: z.coerce.number().nonnegative(),
  tva: z.coerce.number().nonnegative().default(0),
  issue_date: z.string().trim().min(1, "Date requise"),
  due_date: optionalText,
  status: z.enum(["draft", "to_send", "sent", "pending", "paid", "partially_paid", "overdue", "cancelled"]),
  confidential_notes: optionalText,
});
