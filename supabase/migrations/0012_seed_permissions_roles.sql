-- ============================================================================
-- Permission catalog
-- ============================================================================
insert into permissions (module, action, key, is_sensitive, description) values
  ('dashboard', 'view', 'dashboard.view', false, 'Voir le tableau de bord'),

  ('partners', 'view', 'partners.view', false, 'Voir les partenaires'),
  ('partners', 'create', 'partners.create', false, 'Créer un partenaire'),
  ('partners', 'edit', 'partners.edit', false, 'Modifier un partenaire'),
  ('partners', 'delete', 'partners.delete', false, 'Archiver un partenaire'),
  ('partners', 'download', 'partners.download', false, 'Télécharger les documents partenaires'),
  ('partners', 'import', 'partners.import', false, 'Importer des partenaires'),
  ('partners', 'export', 'partners.export', false, 'Exporter les partenaires'),
  ('partners', 'assign', 'partners.assign', false, 'Attribuer un partenaire à un membre'),
  ('partners', 'change_status', 'partners.change_status', false, 'Changer le statut de prospection'),
  ('partners', 'view_history', 'partners.view_history', false, 'Voir l’historique des échanges'),
  ('partners', 'view_comments', 'partners.view_comments', false, 'Voir les commentaires internes'),
  ('partners', 'view_amounts', 'partners.view_amounts', true, 'Voir les montants espéré / proposé / confirmé'),
  ('partners', 'view_confidential_notes', 'partners.view_confidential_notes', true, 'Voir les notes confidentielles du partenaire'),

  ('speakers', 'view', 'speakers.view', false, 'Voir les speakers'),
  ('speakers', 'create', 'speakers.create', false, 'Créer un speaker'),
  ('speakers', 'edit', 'speakers.edit', false, 'Modifier un speaker'),
  ('speakers', 'delete', 'speakers.delete', false, 'Archiver un speaker'),
  ('speakers', 'download', 'speakers.download', false, 'Télécharger les documents speaker'),
  ('speakers', 'import', 'speakers.import', false, 'Importer des speakers'),
  ('speakers', 'export', 'speakers.export', false, 'Exporter les speakers'),
  ('speakers', 'assign', 'speakers.assign', false, 'Attribuer un speaker à un membre'),
  ('speakers', 'change_status', 'speakers.change_status', false, 'Changer le statut du speaker'),
  ('speakers', 'view_history', 'speakers.view_history', false, 'Voir la timeline de suivi'),
  ('speakers', 'view_comments', 'speakers.view_comments', false, 'Voir les commentaires internes'),
  ('speakers', 'view_personal_info', 'speakers.view_personal_info', true, 'Voir les coordonnées personnelles du speaker'),

  ('team', 'view', 'team.view', false, 'Voir l’équipe'),
  ('team', 'create', 'team.create', false, 'Ajouter un membre'),
  ('team', 'edit', 'team.edit', false, 'Modifier un membre'),
  ('team', 'delete', 'team.delete', false, 'Archiver un membre'),
  ('team', 'export', 'team.export', false, 'Exporter l’équipe'),
  ('team', 'assign', 'team.assign', false, 'Attribuer une mission'),
  ('team', 'view_personal_data', 'team.view_personal_data', true, 'Voir les données personnelles des membres'),

  ('tasks', 'view', 'tasks.view', false, 'Voir les tâches'),
  ('tasks', 'create', 'tasks.create', false, 'Créer une tâche'),
  ('tasks', 'edit', 'tasks.edit', false, 'Modifier une tâche'),
  ('tasks', 'delete', 'tasks.delete', false, 'Supprimer une tâche'),
  ('tasks', 'assign', 'tasks.assign', false, 'Attribuer une tâche'),
  ('tasks', 'change_status', 'tasks.change_status', false, 'Changer le statut d’une tâche'),
  ('tasks', 'view_comments', 'tasks.view_comments', false, 'Voir les commentaires internes'),
  ('tasks', 'export', 'tasks.export', false, 'Exporter les tâches'),

  ('calendar', 'view', 'calendar.view', false, 'Voir le calendrier'),
  ('calendar', 'create', 'calendar.create', false, 'Créer un événement au calendrier'),
  ('calendar', 'edit', 'calendar.edit', false, 'Modifier un événement au calendrier'),
  ('calendar', 'delete', 'calendar.delete', false, 'Supprimer un événement au calendrier'),
  ('calendar', 'export', 'calendar.export', false, 'Exporter le calendrier'),

  ('budget', 'view', 'budget.view', true, 'Voir le budget et les mouvements financiers'),
  ('budget', 'create', 'budget.create', false, 'Créer un mouvement financier'),
  ('budget', 'edit', 'budget.edit', false, 'Modifier un mouvement financier'),
  ('budget', 'delete', 'budget.delete', false, 'Supprimer un mouvement financier'),
  ('budget', 'export', 'budget.export', false, 'Exporter le budget'),
  ('budget', 'view_bank_details', 'budget.view_bank_details', true, 'Voir les coordonnées bancaires'),

  ('invoices', 'view', 'invoices.view', true, 'Voir les factures'),
  ('invoices', 'create', 'invoices.create', false, 'Créer une facture'),
  ('invoices', 'edit', 'invoices.edit', false, 'Modifier une facture'),
  ('invoices', 'delete', 'invoices.delete', false, 'Supprimer une facture'),
  ('invoices', 'download', 'invoices.download', false, 'Télécharger une facture'),
  ('invoices', 'export', 'invoices.export', false, 'Exporter les factures'),

  ('documents', 'view', 'documents.view', false, 'Voir les documents'),
  ('documents', 'create', 'documents.create', false, 'Ajouter un document'),
  ('documents', 'edit', 'documents.edit', false, 'Modifier un document'),
  ('documents', 'delete', 'documents.delete', false, 'Supprimer un document'),
  ('documents', 'download', 'documents.download', false, 'Télécharger un document'),
  ('documents', 'import', 'documents.import', false, 'Importer un document'),
  ('documents', 'export', 'documents.export', false, 'Exporter des documents'),
  ('documents', 'view_history', 'documents.view_history', false, 'Voir l’historique des téléchargements'),
  ('documents', 'view_administrative', 'documents.view_administrative', true, 'Voir les documents confidentiels / administratifs'),

  ('followups', 'view', 'followups.view', false, 'Voir les relances'),
  ('followups', 'create', 'followups.create', false, 'Créer une relance'),
  ('followups', 'edit', 'followups.edit', false, 'Modifier une relance'),
  ('followups', 'delete', 'followups.delete', false, 'Supprimer une relance'),
  ('followups', 'assign', 'followups.assign', false, 'Attribuer une relance'),
  ('followups', 'change_status', 'followups.change_status', false, 'Changer le statut d’une relance'),
  ('followups', 'export', 'followups.export', false, 'Exporter les relances'),

  ('settings', 'view', 'settings.view', false, 'Voir les paramètres de l’événement'),
  ('settings', 'edit', 'settings.edit', false, 'Modifier les paramètres de l’événement'),

  ('users', 'view', 'users.view', false, 'Voir les utilisateurs et leurs accès'),
  ('users', 'create', 'users.create', false, 'Inviter un utilisateur'),
  ('users', 'edit', 'users.edit', false, 'Modifier un rôle ou une permission'),
  ('users', 'delete', 'users.delete', false, 'Désactiver / supprimer un accès'),
  ('users', 'export', 'users.export', false, 'Exporter la liste des utilisateurs'),

  ('activity_log', 'view', 'activity_log.view', false, 'Voir le journal d’activité');

-- ============================================================================
-- System roles (event_id null → shared templates, usable by any event).
-- Only super_admin can create/edit/delete rows in `roles` and
-- `role_permissions` (enforced in RLS); these are the starting defaults.
-- ============================================================================
insert into roles (event_id, name, slug, description, is_system) values
  (null, 'Super-administratrice', 'super_admin', 'Propriétaire de la plateforme, tous les droits.', true),
  (null, 'Administrateur', 'admin', 'Accès large à tous les modules d’un événement.', true),
  (null, 'Responsable partenaires', 'partner_manager', 'Pilote la prospection et le suivi des partenaires.', true),
  (null, 'Responsable speakers', 'speaker_manager', 'Pilote le recrutement et le suivi des speakers.', true),
  (null, 'Responsable communication', 'communication_manager', 'Gère la communication et les documents associés.', true),
  (null, 'Responsable logistique', 'logistics_manager', 'Gère la logistique, le calendrier et l’équipe terrain.', true),
  (null, 'Responsable finances', 'finance_manager', 'Gère le budget, les recettes, dépenses et factures.', true),
  (null, 'Membre de l’équipe', 'team_member', 'Accès aux ressources qui lui sont attribuées.', true),
  (null, 'Bénévole', 'volunteer', 'Accès minimal, étendu au cas par cas via des exceptions.', true),
  (null, 'Lecture seule', 'read_only', 'Consultation uniquement, aucune donnée sensible.', true);

-- ============================================================================
-- Default role_permissions grants.
-- ============================================================================
with role_grants (role_slug, permission_key, allowed, scope) as (
  values
    -- super_admin: full grant at scope 'all' on every permission, for
    -- display/consistency in the matrix UI. is_super_admin already bypasses
    -- this entirely at the has_permission()/get_scope() level.
    ('super_admin', 'dashboard.view', true, 'all'),
    ('super_admin', 'partners.view', true, 'all'), ('super_admin', 'partners.create', true, 'all'),
    ('super_admin', 'partners.edit', true, 'all'), ('super_admin', 'partners.delete', true, 'all'),
    ('super_admin', 'partners.download', true, 'all'), ('super_admin', 'partners.import', true, 'all'),
    ('super_admin', 'partners.export', true, 'all'), ('super_admin', 'partners.assign', true, 'all'),
    ('super_admin', 'partners.change_status', true, 'all'), ('super_admin', 'partners.view_history', true, 'all'),
    ('super_admin', 'partners.view_comments', true, 'all'), ('super_admin', 'partners.view_amounts', true, 'all'),
    ('super_admin', 'partners.view_confidential_notes', true, 'all'),
    ('super_admin', 'speakers.view', true, 'all'), ('super_admin', 'speakers.create', true, 'all'),
    ('super_admin', 'speakers.edit', true, 'all'), ('super_admin', 'speakers.delete', true, 'all'),
    ('super_admin', 'speakers.download', true, 'all'), ('super_admin', 'speakers.import', true, 'all'),
    ('super_admin', 'speakers.export', true, 'all'), ('super_admin', 'speakers.assign', true, 'all'),
    ('super_admin', 'speakers.change_status', true, 'all'), ('super_admin', 'speakers.view_history', true, 'all'),
    ('super_admin', 'speakers.view_comments', true, 'all'), ('super_admin', 'speakers.view_personal_info', true, 'all'),
    ('super_admin', 'team.view', true, 'all'), ('super_admin', 'team.create', true, 'all'),
    ('super_admin', 'team.edit', true, 'all'), ('super_admin', 'team.delete', true, 'all'),
    ('super_admin', 'team.export', true, 'all'), ('super_admin', 'team.assign', true, 'all'),
    ('super_admin', 'team.view_personal_data', true, 'all'),
    ('super_admin', 'tasks.view', true, 'all'), ('super_admin', 'tasks.create', true, 'all'),
    ('super_admin', 'tasks.edit', true, 'all'), ('super_admin', 'tasks.delete', true, 'all'),
    ('super_admin', 'tasks.assign', true, 'all'), ('super_admin', 'tasks.change_status', true, 'all'),
    ('super_admin', 'tasks.view_comments', true, 'all'), ('super_admin', 'tasks.export', true, 'all'),
    ('super_admin', 'calendar.view', true, 'all'), ('super_admin', 'calendar.create', true, 'all'),
    ('super_admin', 'calendar.edit', true, 'all'), ('super_admin', 'calendar.delete', true, 'all'),
    ('super_admin', 'calendar.export', true, 'all'),
    ('super_admin', 'budget.view', true, 'all'), ('super_admin', 'budget.create', true, 'all'),
    ('super_admin', 'budget.edit', true, 'all'), ('super_admin', 'budget.delete', true, 'all'),
    ('super_admin', 'budget.export', true, 'all'), ('super_admin', 'budget.view_bank_details', true, 'all'),
    ('super_admin', 'invoices.view', true, 'all'), ('super_admin', 'invoices.create', true, 'all'),
    ('super_admin', 'invoices.edit', true, 'all'), ('super_admin', 'invoices.delete', true, 'all'),
    ('super_admin', 'invoices.download', true, 'all'), ('super_admin', 'invoices.export', true, 'all'),
    ('super_admin', 'documents.view', true, 'all'), ('super_admin', 'documents.create', true, 'all'),
    ('super_admin', 'documents.edit', true, 'all'), ('super_admin', 'documents.delete', true, 'all'),
    ('super_admin', 'documents.download', true, 'all'), ('super_admin', 'documents.import', true, 'all'),
    ('super_admin', 'documents.export', true, 'all'), ('super_admin', 'documents.view_history', true, 'all'),
    ('super_admin', 'documents.view_administrative', true, 'all'),
    ('super_admin', 'followups.view', true, 'all'), ('super_admin', 'followups.create', true, 'all'),
    ('super_admin', 'followups.edit', true, 'all'), ('super_admin', 'followups.delete', true, 'all'),
    ('super_admin', 'followups.assign', true, 'all'), ('super_admin', 'followups.change_status', true, 'all'),
    ('super_admin', 'followups.export', true, 'all'),
    ('super_admin', 'settings.view', true, 'all'), ('super_admin', 'settings.edit', true, 'all'),
    ('super_admin', 'users.view', true, 'all'), ('super_admin', 'users.create', true, 'all'),
    ('super_admin', 'users.edit', true, 'all'), ('super_admin', 'users.delete', true, 'all'),
    ('super_admin', 'users.export', true, 'all'),
    ('super_admin', 'activity_log.view', true, 'all'),

    -- admin: broad operational access, no destructive user/role management.
    ('admin', 'dashboard.view', true, 'all'),
    ('admin', 'partners.view', true, 'all'), ('admin', 'partners.create', true, 'all'),
    ('admin', 'partners.edit', true, 'all'), ('admin', 'partners.delete', true, 'all'),
    ('admin', 'partners.download', true, 'all'), ('admin', 'partners.import', true, 'all'),
    ('admin', 'partners.export', true, 'all'), ('admin', 'partners.assign', true, 'all'),
    ('admin', 'partners.change_status', true, 'all'), ('admin', 'partners.view_history', true, 'all'),
    ('admin', 'partners.view_comments', true, 'all'), ('admin', 'partners.view_amounts', true, 'all'),
    ('admin', 'partners.view_confidential_notes', true, 'all'),
    ('admin', 'speakers.view', true, 'all'), ('admin', 'speakers.create', true, 'all'),
    ('admin', 'speakers.edit', true, 'all'), ('admin', 'speakers.delete', true, 'all'),
    ('admin', 'speakers.download', true, 'all'), ('admin', 'speakers.import', true, 'all'),
    ('admin', 'speakers.export', true, 'all'), ('admin', 'speakers.assign', true, 'all'),
    ('admin', 'speakers.change_status', true, 'all'), ('admin', 'speakers.view_history', true, 'all'),
    ('admin', 'speakers.view_comments', true, 'all'), ('admin', 'speakers.view_personal_info', true, 'all'),
    ('admin', 'team.view', true, 'all'), ('admin', 'team.create', true, 'all'),
    ('admin', 'team.edit', true, 'all'), ('admin', 'team.delete', true, 'all'),
    ('admin', 'team.export', true, 'all'), ('admin', 'team.assign', true, 'all'),
    ('admin', 'team.view_personal_data', true, 'all'),
    ('admin', 'tasks.view', true, 'all'), ('admin', 'tasks.create', true, 'all'),
    ('admin', 'tasks.edit', true, 'all'), ('admin', 'tasks.delete', true, 'all'),
    ('admin', 'tasks.assign', true, 'all'), ('admin', 'tasks.change_status', true, 'all'),
    ('admin', 'tasks.view_comments', true, 'all'), ('admin', 'tasks.export', true, 'all'),
    ('admin', 'calendar.view', true, 'all'), ('admin', 'calendar.create', true, 'all'),
    ('admin', 'calendar.edit', true, 'all'), ('admin', 'calendar.delete', true, 'all'),
    ('admin', 'calendar.export', true, 'all'),
    ('admin', 'budget.view', true, 'all'), ('admin', 'budget.create', true, 'all'),
    ('admin', 'budget.edit', true, 'all'), ('admin', 'budget.delete', true, 'all'),
    ('admin', 'budget.export', true, 'all'), ('admin', 'budget.view_bank_details', true, 'all'),
    ('admin', 'invoices.view', true, 'all'), ('admin', 'invoices.create', true, 'all'),
    ('admin', 'invoices.edit', true, 'all'), ('admin', 'invoices.delete', true, 'all'),
    ('admin', 'invoices.download', true, 'all'), ('admin', 'invoices.export', true, 'all'),
    ('admin', 'documents.view', true, 'all'), ('admin', 'documents.create', true, 'all'),
    ('admin', 'documents.edit', true, 'all'), ('admin', 'documents.delete', true, 'all'),
    ('admin', 'documents.download', true, 'all'), ('admin', 'documents.import', true, 'all'),
    ('admin', 'documents.export', true, 'all'), ('admin', 'documents.view_history', true, 'all'),
    ('admin', 'documents.view_administrative', true, 'all'),
    ('admin', 'followups.view', true, 'all'), ('admin', 'followups.create', true, 'all'),
    ('admin', 'followups.edit', true, 'all'), ('admin', 'followups.delete', true, 'all'),
    ('admin', 'followups.assign', true, 'all'), ('admin', 'followups.change_status', true, 'all'),
    ('admin', 'followups.export', true, 'all'),
    ('admin', 'settings.view', true, 'all'), ('admin', 'settings.edit', true, 'all'),
    ('admin', 'users.view', true, 'all'), ('admin', 'users.create', true, 'all'),
    ('admin', 'users.edit', true, 'all'),
    ('admin', 'activity_log.view', true, 'all'),

    -- partner_manager
    ('partner_manager', 'dashboard.view', true, 'all'),
    ('partner_manager', 'partners.view', true, 'all'), ('partner_manager', 'partners.create', true, 'all'),
    ('partner_manager', 'partners.edit', true, 'all'), ('partner_manager', 'partners.download', true, 'all'),
    ('partner_manager', 'partners.import', true, 'all'), ('partner_manager', 'partners.export', true, 'all'),
    ('partner_manager', 'partners.assign', true, 'all'), ('partner_manager', 'partners.change_status', true, 'all'),
    ('partner_manager', 'partners.view_history', true, 'all'), ('partner_manager', 'partners.view_comments', true, 'all'),
    ('partner_manager', 'partners.view_amounts', true, 'all'), ('partner_manager', 'partners.view_confidential_notes', true, 'all'),
    ('partner_manager', 'followups.view', true, 'all'), ('partner_manager', 'followups.create', true, 'all'),
    ('partner_manager', 'followups.edit', true, 'all'), ('partner_manager', 'followups.assign', true, 'all'),
    ('partner_manager', 'followups.change_status', true, 'all'), ('partner_manager', 'followups.export', true, 'all'),
    ('partner_manager', 'documents.view', true, 'all'), ('partner_manager', 'documents.create', true, 'all'),
    ('partner_manager', 'documents.download', true, 'all'),
    ('partner_manager', 'tasks.view', true, 'assigned'), ('partner_manager', 'tasks.edit', true, 'assigned'),
    ('partner_manager', 'tasks.change_status', true, 'assigned'),
    ('partner_manager', 'calendar.view', true, 'assigned'),
    ('partner_manager', 'team.view', true, 'all'),

    -- speaker_manager
    ('speaker_manager', 'dashboard.view', true, 'all'),
    ('speaker_manager', 'speakers.view', true, 'all'), ('speaker_manager', 'speakers.create', true, 'all'),
    ('speaker_manager', 'speakers.edit', true, 'all'), ('speaker_manager', 'speakers.download', true, 'all'),
    ('speaker_manager', 'speakers.import', true, 'all'), ('speaker_manager', 'speakers.export', true, 'all'),
    ('speaker_manager', 'speakers.assign', true, 'all'), ('speaker_manager', 'speakers.change_status', true, 'all'),
    ('speaker_manager', 'speakers.view_history', true, 'all'), ('speaker_manager', 'speakers.view_comments', true, 'all'),
    ('speaker_manager', 'speakers.view_personal_info', true, 'all'),
    ('speaker_manager', 'documents.view', true, 'all'), ('speaker_manager', 'documents.create', true, 'all'),
    ('speaker_manager', 'documents.download', true, 'all'),
    ('speaker_manager', 'tasks.view', true, 'assigned'), ('speaker_manager', 'tasks.edit', true, 'assigned'),
    ('speaker_manager', 'tasks.change_status', true, 'assigned'),
    ('speaker_manager', 'calendar.view', true, 'assigned'),
    ('speaker_manager', 'team.view', true, 'all'),

    -- communication_manager
    ('communication_manager', 'dashboard.view', true, 'all'),
    ('communication_manager', 'documents.view', true, 'all'), ('communication_manager', 'documents.create', true, 'all'),
    ('communication_manager', 'documents.edit', true, 'all'), ('communication_manager', 'documents.download', true, 'all'),
    ('communication_manager', 'documents.import', true, 'all'), ('communication_manager', 'documents.export', true, 'all'),
    ('communication_manager', 'calendar.view', true, 'all'), ('communication_manager', 'calendar.create', true, 'all'),
    ('communication_manager', 'calendar.edit', true, 'all'),
    ('communication_manager', 'speakers.view', true, 'all'),
    ('communication_manager', 'partners.view', true, 'all'),
    ('communication_manager', 'team.view', true, 'all'),
    ('communication_manager', 'tasks.view', true, 'assigned'), ('communication_manager', 'tasks.edit', true, 'assigned'),
    ('communication_manager', 'tasks.change_status', true, 'assigned'),

    -- logistics_manager
    ('logistics_manager', 'dashboard.view', true, 'all'),
    ('logistics_manager', 'tasks.view', true, 'all'), ('logistics_manager', 'tasks.create', true, 'all'),
    ('logistics_manager', 'tasks.edit', true, 'all'), ('logistics_manager', 'tasks.assign', true, 'all'),
    ('logistics_manager', 'tasks.change_status', true, 'all'), ('logistics_manager', 'tasks.export', true, 'all'),
    ('logistics_manager', 'calendar.view', true, 'all'), ('logistics_manager', 'calendar.create', true, 'all'),
    ('logistics_manager', 'calendar.edit', true, 'all'), ('logistics_manager', 'calendar.delete', true, 'all'),
    ('logistics_manager', 'team.view', true, 'all'), ('logistics_manager', 'team.edit', true, 'all'),
    ('logistics_manager', 'team.assign', true, 'all'),
    ('logistics_manager', 'documents.view', true, 'all'), ('logistics_manager', 'documents.create', true, 'all'),
    ('logistics_manager', 'speakers.view', true, 'all'),
    ('logistics_manager', 'partners.view', true, 'assigned'),

    -- finance_manager
    ('finance_manager', 'dashboard.view', true, 'all'),
    ('finance_manager', 'budget.view', true, 'all'), ('finance_manager', 'budget.create', true, 'all'),
    ('finance_manager', 'budget.edit', true, 'all'), ('finance_manager', 'budget.delete', true, 'all'),
    ('finance_manager', 'budget.export', true, 'all'), ('finance_manager', 'budget.view_bank_details', true, 'all'),
    ('finance_manager', 'invoices.view', true, 'all'), ('finance_manager', 'invoices.create', true, 'all'),
    ('finance_manager', 'invoices.edit', true, 'all'), ('finance_manager', 'invoices.delete', true, 'all'),
    ('finance_manager', 'invoices.download', true, 'all'), ('finance_manager', 'invoices.export', true, 'all'),
    ('finance_manager', 'partners.view', true, 'all'), ('finance_manager', 'partners.view_amounts', true, 'all'),
    ('finance_manager', 'documents.view', true, 'all'), ('finance_manager', 'documents.create', true, 'all'),
    ('finance_manager', 'documents.view_administrative', true, 'all'),
    ('finance_manager', 'tasks.view', true, 'assigned'), ('finance_manager', 'tasks.edit', true, 'assigned'),

    -- team_member: baseline access to what's assigned to them.
    ('team_member', 'dashboard.view', true, 'all'),
    ('team_member', 'tasks.view', true, 'assigned'), ('team_member', 'tasks.edit', true, 'assigned'),
    ('team_member', 'tasks.change_status', true, 'assigned'),
    ('team_member', 'calendar.view', true, 'assigned'),
    ('team_member', 'partners.view', true, 'assigned'),
    ('team_member', 'speakers.view', true, 'assigned'),
    ('team_member', 'documents.view', true, 'assigned'),
    ('team_member', 'followups.view', true, 'assigned'), ('team_member', 'followups.change_status', true, 'assigned'),
    ('team_member', 'team.view', true, 'all'),

    -- volunteer: minimal baseline; broadened case-by-case via
    -- user_permission_overrides on specific resources.
    ('volunteer', 'dashboard.view', true, 'all'),
    ('volunteer', 'tasks.view', true, 'assigned'), ('volunteer', 'tasks.change_status', true, 'assigned'),
    ('volunteer', 'calendar.view', true, 'assigned'),
    ('volunteer', 'partners.view', true, 'none'),
    ('volunteer', 'speakers.view', true, 'none'),
    ('volunteer', 'documents.view', true, 'none'),
    ('volunteer', 'followups.view', true, 'none'),

    -- read_only: consultation only, no sensitive data, no module access
    -- to finance/users/settings.
    ('read_only', 'dashboard.view', true, 'all'),
    ('read_only', 'partners.view', true, 'all'),
    ('read_only', 'speakers.view', true, 'all'),
    ('read_only', 'team.view', true, 'all'),
    ('read_only', 'tasks.view', true, 'all'),
    ('read_only', 'calendar.view', true, 'all'),
    ('read_only', 'documents.view', true, 'all'),
    ('read_only', 'followups.view', true, 'all')
)
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, g.allowed, g.scope::permission_scope
from role_grants g
join roles r on r.slug = g.role_slug and r.event_id is null
join permissions p on p.key = g.permission_key;

-- ============================================================================
-- Default event: TEDx Belfort 2026
-- ============================================================================
insert into events (
  name, slug, theme, description, event_date, location, status,
  sponsoring_goal, budget_forecast, currency
) values (
  'TEDx Belfort 2026',
  'tedx-belfort-2026',
  'L’humanité et sa créativité',
  'Édition 2026 de TEDx Belfort, organisée de manière indépendante sous licence TED.',
  '2026-12-11',
  'Belfort',
  'planning',
  30000,
  45000,
  'EUR'
);
