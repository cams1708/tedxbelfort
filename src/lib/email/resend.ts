import "server-only";
import { Resend } from "resend";

let cachedClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) cachedClient = new Resend(process.env.RESEND_API_KEY);
  return cachedClient;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends a real transactional e-mail via Resend. Returns an explicit error
 * (never silently "succeeds") when RESEND_API_KEY / RESEND_FROM_EMAIL are
 * not configured, so the app never claims to have sent an e-mail that
 * wasn't actually sent.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ success: true } | { error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { error: "L’envoi d’e-mails n’est pas configuré (RESEND_API_KEY manquant)." };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { error: "L’envoi d’e-mails n’est pas configuré (RESEND_FROM_EMAIL manquant)." };
  }

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
