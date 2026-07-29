import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
});

const passwordField = z.string().min(8, "8 caractères minimum");

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const acceptInviteSchema = z
  .object({
    fullName: z.string().trim().min(2, "Nom requis"),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  fullName: z.string().trim().min(2, "Nom requis"),
  roleId: z.string().uuid("Rôle requis"),
});
