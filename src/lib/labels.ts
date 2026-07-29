import type {
  PartnerStatus,
  PartnerPriority,
  SpeakerStatus,
  TaskStatus,
  TaskPriority,
  InvoiceStatus,
  TransactionStatus,
  FollowupStatus,
  DocumentConfidentiality,
  TeamPole,
  ContributionType,
} from "@/types/database.types";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, { label: string; tone: BadgeTone }> = {
  to_research: { label: "À rechercher", tone: "neutral" },
  to_prospect: { label: "À prospecter", tone: "neutral" },
  first_contact_done: { label: "Premier contact effectué", tone: "info" },
  awaiting_response: { label: "En attente de réponse", tone: "info" },
  to_follow_up: { label: "À relancer", tone: "warning" },
  meeting_scheduled: { label: "Rendez-vous prévu", tone: "info" },
  in_negotiation: { label: "En négociation", tone: "info" },
  proposal_sent: { label: "Proposition envoyée", tone: "info" },
  agreement_in_principle: { label: "Accord de principe", tone: "success" },
  confirmed: { label: "Partenaire confirmé", tone: "success" },
  contract_signed: { label: "Convention signée", tone: "success" },
  declined: { label: "Refus", tone: "danger" },
  no_response: { label: "Sans réponse", tone: "warning" },
  abandoned: { label: "Abandonné", tone: "neutral" },
};

export const PARTNER_PRIORITY_LABELS: Record<PartnerPriority, { label: string; tone: BadgeTone }> = {
  low: { label: "Faible", tone: "neutral" },
  medium: { label: "Moyenne", tone: "info" },
  high: { label: "Haute", tone: "warning" },
};

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  financial: "Financière",
  in_kind: "Nature",
  media: "Média",
  institutional: "Institutionnelle",
  other: "Autre",
};

export const SPEAKER_STATUS_LABELS: Record<SpeakerStatus, { label: string; tone: BadgeTone }> = {
  considered: { label: "Profil envisagé", tone: "neutral" },
  to_contact: { label: "À contacter", tone: "neutral" },
  contacted: { label: "Contacté", tone: "info" },
  in_discussion: { label: "En discussion", tone: "info" },
  awaiting_response: { label: "En attente de réponse", tone: "info" },
  confirmed: { label: "Confirmé", tone: "success" },
  declined: { label: "Refusé", tone: "danger" },
  withdrawn: { label: "Désistement", tone: "danger" },
  talk_in_progress: { label: "Talk en préparation", tone: "info" },
  talk_to_validate: { label: "Talk à valider", tone: "warning" },
  talk_validated: { label: "Talk validé", tone: "success" },
  ready: { label: "Prêt pour l’événement", tone: "success" },
};

export const TASK_STATUS_LABELS: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  todo: { label: "À faire", tone: "neutral" },
  in_progress: { label: "En cours", tone: "info" },
  waiting: { label: "En attente", tone: "warning" },
  blocked: { label: "Bloquée", tone: "danger" },
  to_validate: { label: "À valider", tone: "warning" },
  done: { label: "Terminée", tone: "success" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  low: { label: "Faible", tone: "neutral" },
  normal: { label: "Normale", tone: "info" },
  high: { label: "Élevée", tone: "warning" },
  urgent: { label: "Urgente", tone: "danger" },
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  to_send: { label: "À envoyer", tone: "warning" },
  sent: { label: "Envoyée", tone: "info" },
  pending: { label: "En attente", tone: "warning" },
  paid: { label: "Payée", tone: "success" },
  partially_paid: { label: "Partiellement payée", tone: "warning" },
  overdue: { label: "En retard", tone: "danger" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, { label: string; tone: BadgeTone }> = {
  planned: { label: "Prévu", tone: "neutral" },
  engaged: { label: "Engagé", tone: "info" },
  invoiced: { label: "Facturé", tone: "info" },
  paid: { label: "Payé", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowupStatus, { label: string; tone: BadgeTone }> = {
  upcoming: { label: "À venir", tone: "info" },
  due_today: { label: "Aujourd’hui", tone: "warning" },
  overdue: { label: "En retard", tone: "danger" },
  done: { label: "Terminée", tone: "success" },
};

export const DOCUMENT_CONFIDENTIALITY_LABELS: Record<DocumentConfidentiality, string> = {
  team_public: "Public pour l’équipe",
  pole_restricted: "Limité à un pôle",
  assigned_only: "Limité aux personnes attribuées",
  confidential: "Confidentiel",
  super_admin_only: "Réservé à la super-administratrice",
};

export const TEAM_POLE_LABELS: Record<TeamPole, string> = {
  direction: "Direction",
  partners: "Partenaires",
  speakers: "Speakers",
  communication: "Communication",
  logistics: "Logistique",
  technical: "Technique",
  reception: "Accueil",
  finance: "Finances",
  volunteers: "Bénévoles",
};
