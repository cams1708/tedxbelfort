import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const teamPoleValues = [
  "direction",
  "partners",
  "speakers",
  "communication",
  "logistics",
  "technical",
  "reception",
  "finance",
  "volunteers",
] as const;

export const teamMemberFormSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis"),
  last_name: z.string().trim().min(1, "Nom requis"),
  role_label: optionalText,
  pole: z.enum(teamPoleValues),
  arrival_date: optionalText,
  availability: optionalText,
  workload_notes: optionalText,
  profile_id: optionalText,
});

export const teamMemberPrivateSchema = z.object({
  email: z.string().trim().email("E-mail invalide").optional().or(z.literal("")),
  phone: optionalText,
  admin_confidential_notes: optionalText,
});
