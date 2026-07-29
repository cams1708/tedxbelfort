import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const calendarItemTypeValues = [
  "meeting",
  "followup",
  "deadline",
  "rehearsal",
  "partner_appointment",
  "speaker_appointment",
  "payment_date",
  "contractual_deadline",
  "internal",
  "d_day",
] as const;

export const calendarItemSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis"),
    description: optionalText,
    type: z.enum(calendarItemTypeValues),
    start_date: z.string().trim().min(1, "Date requise"),
    start_time: optionalText,
    end_time: optionalText,
    all_day: z.coerce.boolean().optional(),
    visibility: z.enum(["all", "pole", "assigned"]),
  })
  .transform((data) => ({
    ...data,
    start_at: data.all_day ? `${data.start_date}T00:00:00` : `${data.start_date}T${data.start_time || "09:00"}:00`,
    end_at:
      !data.all_day && data.end_time ? `${data.start_date}T${data.end_time}:00` : undefined,
  }));
