import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const speakerStatusValues = [
  "considered",
  "to_contact",
  "contacted",
  "in_discussion",
  "awaiting_response",
  "confirmed",
  "declined",
  "withdrawn",
  "talk_in_progress",
  "talk_to_validate",
  "talk_validated",
  "ready",
] as const;

export const speakerFormSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis"),
  last_name: z.string().trim().min(1, "Nom requis"),
  city: optionalText,
  profession: optionalText,
  company: optionalText,
  bio: optionalText,
  proposed_topic: optionalText,
  talk_title: optionalText,
  talk_summary: optionalText,
  talk_angle: optionalText,
  duration_minutes: z.coerce.number().int().positive().optional(),
  owner_id: optionalText,
  status: z.enum(speakerStatusValues),
  availability: optionalText,
  constraints: optionalText,
  technical_needs: optionalText,
  accessibility_needs: optionalText,
  transport: optionalText,
  accommodation: optionalText,
  notes: optionalText,
});

export type SpeakerFormValues = z.infer<typeof speakerFormSchema>;

export const speakerPrivateSchema = z.object({
  email: z.string().trim().email("E-mail invalide").optional().or(z.literal("")),
  phone: optionalText,
  confidential_notes: optionalText,
});

export const speakerTimelineSchema = z.object({
  event_type: z.string().trim().min(1),
  note: optionalText,
});
