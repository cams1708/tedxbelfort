import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const taskStatusValues = ["todo", "in_progress", "waiting", "blocked", "to_validate", "done", "cancelled"] as const;
export const taskPriorityValues = ["low", "normal", "high", "urgent"] as const;
export const taskModuleValues = ["partners", "speakers", "team", "budget", "documents", "general"] as const;

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  description: optionalText,
  module_ref: z.enum(taskModuleValues),
  priority: z.enum(taskPriorityValues),
  status: z.enum(taskStatusValues),
  due_date: optionalText,
  owner_id: optionalText,
});

export const taskCommentSchema = z.object({
  body: z.string().trim().min(1, "Commentaire vide"),
});
