import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const subsidyFormSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  grantor: optionalText,
  amount_requested: z.coerce.number().nonnegative().optional(),
  amount_granted: z.coerce.number().nonnegative().optional(),
  amount_received: z.coerce.number().nonnegative().default(0),
  status: z.enum(["requested", "granted", "partially_received", "received", "declined"]),
  notes: optionalText,
});
