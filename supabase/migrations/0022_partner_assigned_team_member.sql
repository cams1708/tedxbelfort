-- "Qui s'occupe de ce partenaire ?" — a lightweight organizational assignment
-- to a team_members roster entry, distinct from partners.owner_id (which
-- references profiles/real accounts and drives the 'assigned' RLS scope).
-- Most team members won't have a platform login, so the responsible-person
-- picker must point at the roster, not at accounts.
alter table partners add column assigned_team_member_id uuid references team_members (id) on delete set null;

create index partners_assigned_team_member_idx on partners (assigned_team_member_id);
