import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const partnerStatusValues = [
  "to_research",
  "to_prospect",
  "first_contact_done",
  "awaiting_response",
  "to_follow_up",
  "meeting_scheduled",
  "in_negotiation",
  "proposal_sent",
  "agreement_in_principle",
  "confirmed",
  "contract_signed",
  "declined",
  "no_response",
  "abandoned",
] as const;

export const partnerFormSchema = z.object({
  company_name: z.string().trim().min(1, "Nom de l’entreprise requis"),
  sector: optionalText,
  website: optionalText,
  address: optionalText,
  contact_name: optionalText,
  contact_role: optionalText,
  contact_email: z.string().trim().email("E-mail invalide").optional().or(z.literal("")),
  contact_phone: optionalText,
  source: optionalText,
  owner_id: optionalText,
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(partnerStatusValues),
  contribution_type: z.enum(["financial", "in_kind", "media", "institutional", "other"]).optional(),
  next_action: optionalText,
  next_followup_date: optionalText,
  notes: optionalText,
  tags: z.string().optional(),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export const partnerAmountsSchema = z.object({
  amount_expected: z.coerce.number().nonnegative().optional(),
  amount_proposed: z.coerce.number().nonnegative().optional(),
  amount_confirmed: z.coerce.number().nonnegative().optional(),
});

export const partnerConfidentialNotesSchema = z.object({
  notes: z.string().trim().optional(),
});

export const interactionSchema = z.object({
  type: z.enum([
    "email",
    "call",
    "meeting",
    "linkedin",
    "proposal_sent",
    "convention_sent",
    "invoice_sent",
    "followup",
    "note",
    "status_change",
  ]),
  summary: z.string().trim().min(1, "Résumé requis"),
  next_action: optionalText,
  next_followup_date: optionalText,
});

export const followupSchema = z.object({
  due_date: z.string().trim().min(1, "Date requise"),
  note: optionalText,
  assigned_to: optionalText,
});

export const documentSendSchema = z.object({
  document_id: optionalText,
  document_type: z.string().trim().min(1, "Type de document requis"),
  recipient_email: z.string().trim().email("E-mail invalide"),
  subject: z.string().trim().min(1, "Objet requis"),
  message: optionalText,
});
