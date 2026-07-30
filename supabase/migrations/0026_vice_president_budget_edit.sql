-- The super-admin asked that the Trésorier, herself, and the Vice-Président
-- all be able to adjust the new Bilan section (which edits budget category
-- forecast amounts) — Vice-Président previously had budget.view only
-- (0016 deliberately kept finance edit rights to Trésorier + super_admin
-- alone). This is an intentional reversal of that specific restriction,
-- scoped to budget only (not invoices, which stays Trésorier-exclusive).
insert into role_permissions (role_id, permission_id, allowed, scope)
select r.id, p.id, true, 'all'
from roles r
cross join permissions p
where r.event_id is null
  and r.slug = 'vice_president'
  and p.key in ('budget.create', 'budget.edit', 'budget.delete')
  and not exists (
    select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
  );
