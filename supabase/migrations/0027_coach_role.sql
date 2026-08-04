-- New "Coach" role: read-only access to Speakers only, nothing else. Sees
-- personal contact info (needed to actually reach the speakers they coach)
-- but cannot create/edit/delete/import/export/change status/assign.
insert into roles (event_id, name, slug, description, is_system) values
  (null, 'Coach', 'coach', 'Accès en lecture seule au module Speakers uniquement, y compris les coordonnées, pour pouvoir contacter les speakers coachés.', true);

insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.event_id is null
  and r.slug = 'coach'
  and p.key in ('speakers.view', 'speakers.view_personal_info', 'speakers.view_history', 'speakers.view_comments');
