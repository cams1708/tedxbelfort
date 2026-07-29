-- Realistic demo data for TEDx Belfort 2026. No accounts exist yet at
-- migration time (users sign up through Supabase Auth afterwards), so every
-- owner_id / created_by / assigned_to here is left null — the super_admin
-- created at first sign-up can assign ownership from the app afterwards.

do $$
declare
  v_event_id uuid;
  v_partner_numeria uuid;
  v_partner_alsavia uuid;
  v_partner_comtoise uuid;
  v_partner_cristal uuid;
  v_partner_fondation uuid;
  v_partner_nordest uuid;
  v_speaker_roussel uuid;
  v_speaker_ferrand uuid;
  v_speaker_dumont uuid;
  v_speaker_weiss uuid;
  v_speaker_elamrani uuid;
  v_cat_sponsoring uuid;
  v_cat_billetterie uuid;
  v_cat_salle uuid;
  v_cat_audiovisuel uuid;
  v_cat_traiteur uuid;
  v_cat_communication uuid;
begin
  select id into v_event_id from events where slug = 'tedx-belfort-2026';

  -- Example placeholder bank details (illustrative IBAN, not a real account)
  -- for the "coordonnées bancaires" sensitive field, gated by budget.view_bank_details.
  insert into event_bank_details (event_id, bank_name, iban, bic, notes)
  values (v_event_id, 'Crédit Mutuel Belfort Centre', 'FR76 3000 6000 0112 3456 7890 189', 'AGRIFRPP123', 'Compte associatif dédié à l’organisation de l’événement.');

  -- ==========================================================================
  -- Partners
  -- ==========================================================================
  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, contribution_type, next_action, next_followup_date, notes, tags)
  values (v_event_id, 'Numeria Digital Belfort', 'Édition de logiciels', 'https://numeria-digital.example', '12 avenue de l’Espérance, 90000 Belfort', 'Claire Vasseur', 'Directrice marketing', 'c.vasseur@numeria-digital.example', '03 84 55 12 30', 'Recommandation membre du bureau', 'high', 'in_negotiation', 'financial', 'Envoyer la grille des offres de sponsoring', current_date + interval '5 days', 'Très intéressés par la visibilité sur les réseaux sociaux de l’événement.', '{"tech","local"}')
  returning id into v_partner_numeria;

  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, contribution_type, next_action, next_followup_date, notes, tags)
  values (v_event_id, 'Alsavia Industries', 'Mécanique de précision', 'https://alsavia-industries.example', '4 rue des Forges, 90400 Danjoutin', 'Julien Marchetti', 'Responsable RSE', 'j.marchetti@alsavia-industries.example', '03 84 22 45 10', 'Salon régional de l’industrie', 'high', 'proposal_sent', 'financial', 'Relancer suite à l’envoi de la proposition', current_date + interval '3 days', 'Budget RSE validé pour le dernier trimestre.', '{"industrie"}')
  returning id into v_partner_alsavia;

  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, contribution_type, next_action, next_followup_date, notes, tags)
  values (v_event_id, 'Banque Comtoise Entreprises', 'Banque et assurance', 'https://banque-comtoise.example', '1 place de la Révolution Française, 90000 Belfort', 'Sophie Grandjean', 'Chargée de mécénat', 's.grandjean@banque-comtoise.example', '03 84 90 33 21', 'Contact direct', 'medium', 'meeting_scheduled', 'financial', 'Préparer le rendez-vous du 15', current_date + interval '10 days', null, '{"finance"}')
  returning id into v_partner_comtoise;

  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, contribution_type, next_action, next_followup_date, notes, tags)
  values (v_event_id, 'Cristal Énergies', 'Énergie', 'https://cristal-energies.example', '8 boulevard Carnot, 90000 Belfort', 'Marc Bertin', 'Directeur communication', 'm.bertin@cristal-energies.example', '03 84 11 08 44', 'Prospection à froid', 'medium', 'to_follow_up', 'in_kind', 'Envoyer un e-mail de première prise de contact', current_date + interval '2 days', null, '{"energie"}')
  returning id into v_partner_cristal;

  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, contribution_type, signed_at, notes, tags)
  values (v_event_id, 'Fondation Comtoise pour l’Innovation', 'Fondation privée', 'https://fondation-comtoise.example', '20 rue du Général Négrier, 90000 Belfort', 'Isabelle Roy', 'Secrétaire générale', 'i.roy@fondation-comtoise.example', '03 84 77 19 60', 'Réseau associatif TEDx', 'high', 'confirmed', 'financial', current_date - interval '20 days', 'Premier partenaire confirmé de l’édition 2026, très engagé.', '{"fondation","confirmed"}')
  returning id into v_partner_fondation;

  insert into partners (event_id, company_name, sector, website, address, contact_name, contact_role, contact_email, contact_phone, source, priority, status, notes, tags)
  values (v_event_id, 'Groupe Nord-Est Mutuelle', 'Assurance mutuelle', 'https://nordest-mutuelle.example', '55 faubourg de Montbéliard, 90000 Belfort', 'David Hoarau', 'Responsable partenariats', 'd.hoarau@nordest-mutuelle.example', '03 84 40 77 02', 'Prospection à froid', 'low', 'no_response', 'Deux relances envoyées sans retour, à réévaluer.', '{"assurance"}')
  returning id into v_partner_nordest;

  insert into partner_amounts (partner_id, amount_expected, amount_proposed, amount_confirmed) values
    (v_partner_numeria, 5000, 4000, null),
    (v_partner_alsavia, 8000, 6000, null),
    (v_partner_comtoise, 4000, null, null),
    (v_partner_cristal, 3000, null, null),
    (v_partner_fondation, 10000, 10000, 10000),
    (v_partner_nordest, 2000, null, null);

  insert into partner_confidential_notes (partner_id, notes) values
    (v_partner_alsavia, 'Le directeur général doit valider personnellement tout montant supérieur à 5000€ ; prévoir un temps de latence.'),
    (v_partner_fondation, 'Souhaite rester discret sur le montant exact dans la communication publique.');

  insert into partner_contacts (partner_id, name, role, email, phone, is_primary) values
    (v_partner_numeria, 'Claire Vasseur', 'Directrice marketing', 'c.vasseur@numeria-digital.example', '03 84 55 12 30', true),
    (v_partner_alsavia, 'Julien Marchetti', 'Responsable RSE', 'j.marchetti@alsavia-industries.example', '03 84 22 45 10', true),
    (v_partner_fondation, 'Isabelle Roy', 'Secrétaire générale', 'i.roy@fondation-comtoise.example', '03 84 77 19 60', true);

  insert into partner_interactions (event_id, partner_id, type, summary, next_action, next_followup_date, created_at) values
    (v_event_id, v_partner_numeria, 'call', 'Premier appel de cadrage, présentation du dossier de partenariat.', 'Envoyer la grille des offres', current_date + interval '5 days', now() - interval '6 days'),
    (v_event_id, v_partner_numeria, 'email', 'Envoi de la grille des offres de sponsoring par e-mail.', 'Relancer si pas de retour sous 5 jours', current_date + interval '5 days', now() - interval '2 days'),
    (v_event_id, v_partner_alsavia, 'proposal_sent', 'Proposition de partenariat "Or" envoyée avec contreparties détaillées.', 'Relancer par téléphone', current_date + interval '3 days', now() - interval '4 days'),
    (v_event_id, v_partner_fondation, 'convention_sent', 'Convention de partenariat envoyée pour signature.', null, null, now() - interval '22 days'),
    (v_event_id, v_partner_fondation, 'status_change', 'Partenaire confirmé après signature de la convention.', null, null, now() - interval '20 days');

  insert into partner_followups (event_id, partner_id, due_date, status, note) values
    (v_event_id, v_partner_numeria, current_date + interval '5 days', 'upcoming', 'Relancer si la grille des offres n’a pas eu de retour.'),
    (v_event_id, v_partner_alsavia, current_date + interval '3 days', 'upcoming', 'Appeler Julien Marchetti pour faire le point sur la proposition.'),
    (v_event_id, v_partner_cristal, current_date + interval '2 days', 'upcoming', 'Premier e-mail de prise de contact.'),
    (v_event_id, v_partner_nordest, current_date - interval '4 days', 'overdue', 'Deuxième relance restée sans réponse, décider de la suite à donner.');

  -- ==========================================================================
  -- Speakers
  -- ==========================================================================
  insert into speakers (event_id, first_name, last_name, city, profession, company, bio, proposed_topic, talk_title, talk_summary, talk_angle, duration_minutes, status, technical_needs, transport, accommodation, notes)
  values (v_event_id, 'Camille', 'Roussel', 'Belfort', 'Chercheuse en robotique', 'UTBM', 'Camille dirige un laboratoire de recherche en robotique collaborative et travaille depuis dix ans sur l’interaction homme-machine.', 'Créativité augmentée par les robots collaboratifs', 'Quand la machine devient partenaire de création', 'Comment les robots collaboratifs ouvrent de nouvelles formes de créativité humaine dans l’industrie et l’art.', 'Techno-optimiste, exemples concrets de cobotique', 16, 'confirmed', 'Vidéoprojecteur + démonstration robotique sur scène', 'Véhicule personnel', 'Non nécessaire (habite Belfort)', 'Speaker très autonome, a déjà donné plusieurs conférences.')
  returning id into v_speaker_roussel;

  insert into speakers (event_id, first_name, last_name, city, profession, company, bio, proposed_topic, talk_title, talk_summary, talk_angle, duration_minutes, status, technical_needs, transport, accommodation, notes)
  values (v_event_id, 'Yanis', 'Ferrand', 'Besançon', 'Sculpteur et designer sonore', 'Atelier Ferrand', 'Yanis mêle sculpture métallique et création sonore pour concevoir des installations immersives exposées dans toute la France.', 'La créativité née des contraintes matérielles', 'Sculpter le son, entendre la matière', 'Comment les contraintes physiques d’un matériau deviennent le point de départ d’une œuvre sonore.', 'Sensible, artistique, avec extrait audio', 14, 'talk_to_validate', 'Système de sonorisation stéréo, table de mixage', 'Train depuis Besançon', 'Hôtel une nuit à réserver', 'Attend le retour de l’équipe sur la première version du talk.')
  returning id into v_speaker_ferrand;

  insert into speakers (event_id, first_name, last_name, city, profession, company, bio, proposed_topic, talk_title, talk_summary, talk_angle, duration_minutes, status, notes)
  values (v_event_id, 'Léa', 'Dumont', 'Mulhouse', 'Sociologue', 'Université de Haute-Alsace', 'Léa étudie les nouvelles formes de créativité collective dans les organisations depuis la généralisation du travail à distance.', 'Créativité collective et travail à distance', null, null, null, null, 'in_discussion', 'En attente de sa décision définitive sur la participation.')
  returning id into v_speaker_dumont;

  insert into speakers (event_id, first_name, last_name, city, profession, company, bio, proposed_topic, talk_title, talk_summary, talk_angle, duration_minutes, status, technical_needs, transport, accommodation, notes)
  values (v_event_id, 'Thomas', 'Weiss', 'Belfort', 'Ingénieur et musicien', 'Indépendant', 'Thomas conçoit des instruments de musique électroniques open-source utilisés par des artistes dans le monde entier.', 'Créer des outils créatifs pour les autres créateurs', 'Construire l’instrument que personne d’autre n’a', 'Le parcours d’un ingénieur devenu luthier électronique, et pourquoi l’open-source change la donne pour les musiciens.', 'Inspirant, démonstration live d’un prototype', 18, 'ready', 'Prise secteur scène, retour son musicien', 'Véhicule personnel', 'Non nécessaire (habite Belfort)', 'Toutes les étapes de la checklist sont validées.')
  returning id into v_speaker_weiss;

  insert into speakers (event_id, first_name, last_name, city, profession, company, bio, proposed_topic, status, notes)
  values (v_event_id, 'Nadia', 'El Amrani', 'Strasbourg', 'Entrepreneure sociale', 'Coopérative Ancrage', 'Nadia a fondé une coopérative qui accompagne des artisans en reconversion vers l’économie circulaire.', 'Réinventer un métier par nécessité', 'to_contact', 'Profil identifié via le réseau des CCI d’Alsace, contact à établir.')
  returning id into v_speaker_elamrani;

  insert into speaker_private (speaker_id, email, phone) values
    (v_speaker_roussel, 'camille.roussel@utbm-example.fr', '06 12 34 56 01'),
    (v_speaker_ferrand, 'yanis.ferrand@atelier-example.fr', '06 12 34 56 02'),
    (v_speaker_dumont, 'lea.dumont@uha-example.fr', '06 12 34 56 03'),
    (v_speaker_weiss, 'thomas.weiss@indep-example.fr', '06 12 34 56 04'),
    (v_speaker_elamrani, 'nadia.elamrani@ancrage-example.fr', '06 12 34 56 05');

  insert into speaker_checklist_items (speaker_id, item_key, is_done) values
    (v_speaker_weiss, 'agreement_obtained', true), (v_speaker_weiss, 'contract_signed', true),
    (v_speaker_weiss, 'image_rights_consent', true), (v_speaker_weiss, 'bio_received', true),
    (v_speaker_weiss, 'hd_photo_received', true), (v_speaker_weiss, 'title_received', true),
    (v_speaker_weiss, 'summary_received', true), (v_speaker_weiss, 'talk_draft_received', true),
    (v_speaker_weiss, 'slides_received', true), (v_speaker_weiss, 'slides_validated', true),
    (v_speaker_weiss, 'rehearsal_1_done', true), (v_speaker_weiss, 'rehearsal_2_done', true),
    (v_speaker_weiss, 'transport_booked', true), (v_speaker_weiss, 'hotel_booked', true),
    (v_speaker_weiss, 'technical_info_validated', true),
    (v_speaker_roussel, 'agreement_obtained', true), (v_speaker_roussel, 'contract_signed', true),
    (v_speaker_roussel, 'image_rights_consent', true), (v_speaker_roussel, 'bio_received', true),
    (v_speaker_roussel, 'hd_photo_received', true), (v_speaker_roussel, 'title_received', true),
    (v_speaker_roussel, 'summary_received', true), (v_speaker_roussel, 'talk_draft_received', false),
    (v_speaker_roussel, 'slides_received', false),
    (v_speaker_ferrand, 'agreement_obtained', true), (v_speaker_ferrand, 'contract_signed', false),
    (v_speaker_ferrand, 'bio_received', true), (v_speaker_ferrand, 'hd_photo_received', false),
    (v_speaker_ferrand, 'title_received', true), (v_speaker_ferrand, 'summary_received', true);

  insert into speaker_timeline (speaker_id, event_type, note, created_at) values
    (v_speaker_weiss, 'status_change', 'Passage au statut "Prêt pour l’événement" après validation technique.', now() - interval '3 days'),
    (v_speaker_ferrand, 'note', 'Première version du talk envoyée par le speaker, en attente de retour de l’équipe.', now() - interval '5 days'),
    (v_speaker_dumont, 'note', 'Speaker encore hésitante, prévoir un appel de réassurance.', now() - interval '1 days');

  -- ==========================================================================
  -- Team roster
  -- ==========================================================================
  insert into team_members (event_id, first_name, last_name, role_label, pole, arrival_date, availability, workload_notes) values
    (v_event_id, 'Hugo', 'Lefebvre', 'Responsable partenaires', 'partners', current_date - interval '90 days', 'Soirs et week-ends', 'Charge élevée en période de prospection.'),
    (v_event_id, 'Manon', 'Girard', 'Responsable speakers', 'speakers', current_date - interval '90 days', 'Disponible en journée', null),
    (v_event_id, 'Karim', 'Belaïd', 'Responsable logistique', 'logistics', current_date - interval '60 days', 'Week-ends principalement', 'Coordonne aussi les bénévoles techniques.'),
    (v_event_id, 'Élise', 'Perrin', 'Chargée de communication', 'communication', current_date - interval '75 days', 'Flexible', null),
    (v_event_id, 'Paul', 'Antoine', 'Bénévole accueil', 'reception', current_date - interval '10 days', 'Jour J uniquement', 'Nouveau bénévole, première édition.');

  -- ==========================================================================
  -- Tasks
  -- ==========================================================================
  insert into tasks (event_id, title, description, module_ref, partner_id, priority, status, due_date) values
    (v_event_id, 'Réserver la salle Le Granit', 'Confirmer la date et signer le contrat de location de la salle.', 'general', null, 'urgent', 'in_progress', current_date + interval '7 days'),
    (v_event_id, 'Finaliser le programme des talks', 'Arrêter l’ordre de passage et la durée définitive de chaque intervention.', 'speakers', null, 'high', 'todo', current_date + interval '30 days'),
    (v_event_id, 'Envoyer la grille des offres à Numeria Digital', 'Préparer et envoyer le document de partenariat personnalisé.', 'partners', v_partner_numeria, 'high', 'to_validate', current_date + interval '5 days'),
    (v_event_id, 'Commander les badges bénévoles', 'Lancer la commande auprès de l’imprimeur habituel.', 'general', null, 'normal', 'todo', current_date + interval '45 days'),
    (v_event_id, 'Répétition générale — Thomas Weiss', 'Organiser une répétition technique complète sur la scène du Granit.', 'speakers', null, 'normal', 'done', current_date - interval '2 days'),
    (v_event_id, 'Relancer Alsavia Industries', 'Appeler Julien Marchetti pour faire le point sur la proposition envoyée.', 'partners', v_partner_alsavia, 'high', 'todo', current_date + interval '3 days'),
    (v_event_id, 'Préparer le kit de communication partenaires', 'Rassembler logo, argumentaire et visuels pour les réseaux sociaux.', 'documents', null, 'normal', 'in_progress', current_date + interval '15 days'),
    (v_event_id, 'Recruter les bénévoles accueil', 'Diffuser l’appel à bénévoles et planifier les entretiens.', 'team', null, 'normal', 'waiting', current_date + interval '60 days');

  -- ==========================================================================
  -- Budget: categories, transactions, invoices
  -- ==========================================================================
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Sponsoring', 'revenue', 30000) returning id into v_cat_sponsoring;
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Billetterie', 'revenue', 8000) returning id into v_cat_billetterie;
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Location de salle', 'expense', 9000) returning id into v_cat_salle;
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Technique / audiovisuel', 'expense', 7000) returning id into v_cat_audiovisuel;
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Traiteur', 'expense', 4000) returning id into v_cat_traiteur;
  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Communication', 'expense', 3000) returning id into v_cat_communication;

  insert into budget_categories (event_id, name, kind, forecast_amount) values
    (v_event_id, 'Subventions', 'revenue', 6000),
    (v_event_id, 'Impression', 'expense', 1200),
    (v_event_id, 'Transport & hébergement speakers', 'expense', 2500),
    (v_event_id, 'Assurance', 'expense', 900),
    (v_event_id, 'Décoration & scénographie', 'expense', 1800);

  insert into financial_transactions (event_id, title, type, category_id, amount_ht, tva_rate, amount_ttc, partner_id, transaction_date, due_date, status, payment_method) values
    (v_event_id, 'Acompte partenariat Fondation Comtoise', 'revenue', v_cat_sponsoring, 10000, 0, 10000, v_partner_fondation, current_date - interval '18 days', null, 'paid', 'bank_transfer'),
    (v_event_id, 'Acompte location Le Granit', 'expense', v_cat_salle, 3000, 20, 3600, null, current_date - interval '10 days', current_date + interval '20 days', 'engaged', 'bank_transfer'),
    (v_event_id, 'Devis prestataire son et lumière', 'expense', v_cat_audiovisuel, 5800, 20, 6960, null, current_date, current_date + interval '40 days', 'planned', null),
    (v_event_id, 'Solde traiteur jour J', 'expense', v_cat_traiteur, 3200, 10, 3520, null, current_date, current_date + interval '90 days', 'planned', null),
    (v_event_id, 'Impression affiches et flyers', 'expense', v_cat_communication, 850, 20, 1020, null, current_date - interval '2 days', current_date + interval '15 days', 'invoiced', null);

  insert into invoices (event_id, number, title, type, partner_id, amount, tva, issue_date, due_date, status) values
    (v_event_id, 'FAC-2026-001', 'Partenariat Fondation Comtoise pour l’Innovation', 'sent_to_partner', v_partner_fondation, 10000, 0, current_date - interval '20 days', current_date - interval '5 days', 'paid'),
    (v_event_id, 'FAC-2026-002', 'Location salle Le Granit — acompte', 'received_from_supplier', null, 3600, 600, current_date - interval '10 days', current_date + interval '20 days', 'pending'),
    (v_event_id, 'FAC-2026-003', 'Impression supports de communication', 'received_from_supplier', null, 1020, 170, current_date - interval '2 days', current_date + interval '15 days', 'to_send');

  -- ==========================================================================
  -- Calendar
  -- ==========================================================================
  insert into calendar_items (event_id, title, description, type, start_at, end_at, all_day, partner_id) values
    (v_event_id, 'Rendez-vous — Banque Comtoise Entreprises', 'Présentation du dossier de partenariat en agence.', 'partner_appointment', now() + interval '10 days' + interval '10 hours', now() + interval '10 days' + interval '11 hours', false, v_partner_comtoise),
    (v_event_id, 'Répétition générale speakers', 'Passage complet de tous les talks confirmés, avec retour technique.', 'rehearsal', now() + interval '25 days' + interval '18 hours', now() + interval '25 days' + interval '21 hours', false, null),
    (v_event_id, 'Échéance paiement acompte salle', 'Date limite de paiement de l’acompte de location du Granit.', 'payment_date', now() + interval '20 days', null, true, null),
    (v_event_id, 'TEDx Belfort 2026 — Jour J', 'L’humanité et sa créativité.', 'd_day', '2026-12-11 09:00+01', '2026-12-11 19:00+01', false, null);
end $$;
