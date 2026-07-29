import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const documentCategoryValues = [
  "partners",
  "speakers",
  "contracts",
  "conventions",
  "invoices",
  "communication",
  "administrative",
  "budget",
  "logistics",
  "technical",
  "team",
] as const;

export const documentConfidentialityValues = [
  "team_public",
  "pole_restricted",
  "assigned_only",
  "confidential",
  "super_admin_only",
] as const;

export const documentUploadSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  category: z.enum(documentCategoryValues),
  confidentiality_level: z.enum(documentConfidentialityValues),
  partner_id: optionalText,
  speaker_id: optionalText,
  task_id: optionalText,
  expires_at: optionalText,
});
