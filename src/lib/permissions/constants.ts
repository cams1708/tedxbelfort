export const MODULES = [
  "dashboard",
  "partners",
  "speakers",
  "team",
  "tasks",
  "calendar",
  "budget",
  "invoices",
  "documents",
  "followups",
  "settings",
  "users",
  "activity_log",
] as const;

export type Module = (typeof MODULES)[number];

export const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "download",
  "import",
  "export",
  "assign",
  "change_status",
  "view_history",
  "view_comments",
  "view_amounts",
  "view_confidential_notes",
  "view_personal_info",
  "view_personal_data",
  "view_administrative",
  "view_bank_details",
] as const;

export type Action = (typeof ACTIONS)[number];

export const MODULE_LABELS: Record<Module, string> = {
  dashboard: "Tableau de bord",
  partners: "Partenaires",
  speakers: "Speakers",
  team: "Équipe",
  tasks: "Tâches",
  calendar: "Calendrier",
  budget: "Budget",
  invoices: "Factures",
  documents: "Documents",
  followups: "Relances",
  settings: "Paramètres",
  users: "Utilisateurs",
  activity_log: "Historique d’activité",
};

export const ACTION_LABELS: Record<Action, string> = {
  view: "Voir",
  create: "Créer",
  edit: "Modifier",
  delete: "Supprimer",
  download: "Télécharger",
  import: "Importer",
  export: "Exporter",
  assign: "Attribuer",
  change_status: "Changer le statut",
  view_history: "Voir l’historique",
  view_comments: "Voir les commentaires internes",
  view_amounts: "Voir les montants",
  view_confidential_notes: "Voir les notes confidentielles",
  view_personal_info: "Voir les coordonnées personnelles",
  view_personal_data: "Voir les données personnelles",
  view_administrative: "Voir les documents confidentiels",
  view_bank_details: "Voir les coordonnées bancaires",
};

// Which (module, action) pairs actually exist — mirrors the seeded
// `permissions` catalog (supabase/migrations/0012_seed_permissions_roles.sql).
// Used to render only the relevant checkboxes in the permission matrix.
export const MODULE_ACTIONS: Record<Module, Action[]> = {
  dashboard: ["view"],
  partners: [
    "view",
    "create",
    "edit",
    "delete",
    "download",
    "import",
    "export",
    "assign",
    "change_status",
    "view_history",
    "view_comments",
    "view_amounts",
    "view_confidential_notes",
  ],
  speakers: [
    "view",
    "create",
    "edit",
    "delete",
    "download",
    "import",
    "export",
    "assign",
    "change_status",
    "view_history",
    "view_comments",
    "view_personal_info",
  ],
  team: ["view", "create", "edit", "delete", "export", "assign", "view_personal_data"],
  tasks: ["view", "create", "edit", "delete", "assign", "change_status", "view_comments", "export"],
  calendar: ["view", "create", "edit", "delete", "export"],
  budget: ["view", "create", "edit", "delete", "export", "view_bank_details"],
  invoices: ["view", "create", "edit", "delete", "download", "export"],
  documents: ["view", "create", "edit", "delete", "download", "import", "export", "view_history", "view_administrative"],
  followups: ["view", "create", "edit", "delete", "assign", "change_status", "export"],
  settings: ["view", "edit"],
  users: ["view", "create", "edit", "delete", "export"],
  activity_log: ["view"],
};

// Modules where access can be scoped to "all / assigned / own / none"
// records rather than being a flat module-level toggle.
export const SCOPED_MODULES: Module[] = ["partners", "speakers", "tasks", "documents", "followups", "calendar"];

export const SENSITIVE_ACTIONS: Action[] = [
  "view_amounts",
  "view_confidential_notes",
  "view_personal_info",
  "view_personal_data",
  "view_administrative",
  "view_bank_details",
];

export function permissionKey(module: Module, action: Action): string {
  return `${module}.${action}`;
}
