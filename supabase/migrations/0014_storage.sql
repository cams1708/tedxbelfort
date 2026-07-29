-- Private bucket for all document uploads. No storage.objects RLS policies
-- are defined for anon/authenticated: every read and write goes through the
-- application's server-side code (using the service role client), which
-- re-checks can_view_document() / has_permission() before ever touching
-- storage. This keeps a single source of truth for authorization instead of
-- duplicating the confidentiality logic inside storage policies.
--
-- storage.objects already has RLS enabled by default on every Supabase
-- project and is owned by an internal role (not `postgres`), so this
-- migration deliberately does not try to ALTER it — doing so fails with
-- "must be owner of table objects" when run from the SQL Editor.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
