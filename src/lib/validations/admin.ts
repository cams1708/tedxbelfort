import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  fullName: z.string().trim().min(2, "Nom requis"),
  roleId: z.string().uuid("Rôle requis"),
});

export const eventSettingsSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  theme: z.string().trim().optional(),
  description: z.string().trim().optional(),
  event_date: z.string().trim().optional(),
  location: z.string().trim().optional(),
  status: z.enum(["planning", "active", "completed", "cancelled"]),
  sponsoring_goal: z.coerce.number().nonnegative().optional(),
  budget_forecast: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().min(1),
  color_primary: z.string().trim().optional(),
  color_secondary: z.string().trim().optional(),
});

export const bankDetailsSchema = z.object({
  bank_name: z.string().trim().optional(),
  iban: z.string().trim().optional(),
  bic: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
