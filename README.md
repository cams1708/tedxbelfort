# TEDx Belfort — Plateforme de gestion d'événements

Application interne multi-événements pour piloter l'organisation de TEDx Belfort 2026 : partenaires, speakers, équipe, tâches, budget, factures, documents, calendrier — avec un système de rôles et permissions granulaire appliqué à la fois côté application et au niveau de la base de données (Row Level Security).

## Stack

Next.js (App Router) · React 19 · TypeScript strict · Tailwind CSS · shadcn/ui (base-nova, sur Base UI) · Supabase (Database, Auth, Storage, RLS) · React Hook Form · Zod · TanStack Table · Recharts · dnd-kit.

## 1. Prérequis

- Node.js 20+
- Un projet Supabase existant (créé sur [supabase.com](https://supabase.com)) — cette app n'utilise pas de stack Supabase locale.
- Le CLI Supabase pour appliquer les migrations : `npx supabase --version` (aucune installation globale nécessaire).

## 2. Installer les dépendances

```bash
npm install
```

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Renseigner dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dans Supabase Dashboard > Project Settings > API.
- `SUPABASE_SERVICE_ROLE_KEY` — **jamais** exposée au client, utilisée uniquement dans les Server Actions/Route Handlers (invitations, envoi de documents, URLs signées).
- `NEXT_PUBLIC_SITE_URL` — l'URL de l'app (`http://localhost:3000` en dev), utilisée pour construire les liens d'invitation et de réinitialisation de mot de passe.
- `CRON_SECRET` (optionnel) — voir §7.

## 4. Appliquer les migrations

Toutes les migrations SQL sont dans `supabase/migrations/`, numérotées et appliquées dans l'ordre : extensions/enums → profils/événements → RBAC → tables métier (partenaires, speakers, équipe/tâches, finance, documents, calendrier) → fonctions & policies RLS → seed (catalogue de permissions, rôles prédéfinis, données de démo) → stockage → notifications.

Relier le projet local au projet Supabase distant puis pousser les migrations :

```bash
npx supabase login
npx supabase link --project-ref <votre-project-ref>
npx supabase db push
```

Alternative sans CLI : coller le contenu de chaque fichier de `supabase/migrations/`, dans l'ordre numérique, dans le SQL Editor du Dashboard Supabase.

Générer ensuite les types TypeScript à jour (le fichier `src/types/database.types.ts` fourni est écrit à la main pour correspondre exactement au schéma — à régénérer si vous modifiez les migrations) :

```bash
npx supabase gen types typescript --project-id <votre-project-ref> --schema public > src/types/database.types.ts
```

## 5. Créer le premier compte (super-administratrice)

Aucune inscription publique n'existe. Pour créer le tout premier compte :

1. Dans Supabase Dashboard > Authentication > Users, cliquer sur « Add user » (ou « Invite ») et créer un compte avec votre e-mail.
2. Ce premier compte devient automatiquement `super_admin` (trigger `handle_new_user`).
3. Se connecter sur `/login` avec ce compte (ou définir un mot de passe via le lien envoyé).

Tous les comptes suivants doivent être invités depuis l'application, dans **Administration > Utilisateurs et accès** (réservé à la super-administratrice ou à un rôle disposant de la permission `users.create`).

## 6. Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## 7. Ce qui est réellement fonctionnel vs ce qui nécessite une configuration supplémentaire

**Fonctionnel, connecté à la base de données, sans configuration supplémentaire :**
authentification complète (connexion, déconnexion, mot de passe oublié, invitation, activation), moteur de permissions (rôles, permissions par module/action, exceptions individuelles, portée par fiche, demandes d'accès), CRUD complet de tous les modules, upload/téléchargement de documents via Supabase Storage avec URLs signées temporaires (5 min), journal d'activité, notifications internes événementielles (tâche attribuée, demande d'accès reçue), mode « Prévisualiser les accès ».

**Nécessite une configuration supplémentaire pour être pleinement opérationnel :**
- **Invitations par e-mail** : `supabase.auth.admin.inviteUserByEmail` dépend de la configuration SMTP du projet Supabase (Dashboard > Authentication > Email Templates/SMTP). Sans SMTP configuré, l'invitation est créée en base mais l'e-mail peut ne pas partir.
- **Envoi réel de documents aux partenaires** : l'intégration Resend est câblée (`src/lib/email/resend.ts`) — l'onglet « Documents » d'une fiche partenaire prépare l'envoi (`partner_document_sends`, statut `préparé`), et un bouton « Envoyer » déclenche l'e-mail réel une fois `RESEND_API_KEY` et `RESEND_FROM_EMAIL` renseignés dans `.env.local`. Tant qu'ils ne le sont pas, le bouton reste caché et le statut n'est jamais faussement marqué « envoyé ».
- **Rappels d'échéance automatiques** (tâches bientôt échues/en retard, relances dues, factures à échéance) : la fonction SQL `generate_due_notifications()` existe et fonctionne, mais n'est déclenchée par rien automatiquement. Pour l'activer, appeler quotidiennement `POST /api/cron/generate-notifications` avec l'en-tête `Authorization: Bearer <CRON_SECRET>` depuis un ordonnanceur externe (Vercel Cron, GitHub Actions, pg_cron si disponible sur votre plan Supabase).

## 8. Vérification de la sécurité

- Chaque table métier est protégée par des policies Row Level Security ; les données sensibles (montants, notes confidentielles, coordonnées personnelles, coordonnées bancaires, documents confidentiels) sont dans des tables séparées avec leurs propres policies, pour qu'une ligne non autorisée ne soit jamais renvoyée par l'API — même en tapant une URL directement.
- Les fonctions `has_permission`/`get_scope` sont protégées contre l'usurpation : seul l'utilisateur lui-même ou une super-administratrice peut résoudre les permissions d'un `p_user` donné.
- Pour vérifier vous-même : créez un compte avec le rôle « Bénévole », connectez-vous, et constatez qu'aucun montant, note confidentielle ou module financier n'est visible ni récupérable.

## Architecture

Voir les fichiers de migration dans `supabase/migrations/` pour le schéma complet (36 tables) et les commentaires expliquant chaque choix de sécurité. Le code applicatif suit `src/app/(app)/<module>/` avec, par module : `page.tsx` (server component), `actions.ts` (Server Actions avec validation Zod), et des composants client dédiés aux formulaires/tableaux/kanban.
