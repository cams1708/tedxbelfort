-- ============================================================================
-- Finance module expansion, part 3/3: permission catalog for the new
-- Subventions module. Same access shape as budget/invoices: Trésorier gets
-- full CRUD + export, every other role except Bénévole gets view-only,
-- super_admin bypasses via has_permission() as always.
-- ============================================================================
insert into permissions (module, action, key, is_sensitive, description) values
  ('subsidies', 'view', 'subsidies.view', true, 'Voir les subventions'),
  ('subsidies', 'create', 'subsidies.create', false, 'Créer une subvention'),
  ('subsidies', 'edit', 'subsidies.edit', false, 'Modifier une subvention'),
  ('subsidies', 'delete', 'subsidies.delete', false, 'Archiver une subvention'),
  ('subsidies', 'export', 'subsidies.export', false, 'Exporter les subventions');

insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.event_id is null
  and r.slug = 'tresorier'
  and p.key in ('subsidies.view', 'subsidies.create', 'subsidies.edit', 'subsidies.delete', 'subsidies.export');

insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.event_id is null
  and r.slug not in ('volunteer', 'tresorier', 'super_admin')
  and p.key = 'subsidies.view';
