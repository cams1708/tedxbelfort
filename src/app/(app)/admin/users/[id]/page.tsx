import { notFound } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { UserDetailHeader } from "@/app/(app)/admin/users/[id]/user-detail-header";
import { PermissionMatrix } from "@/app/(app)/admin/users/[id]/permission-matrix";
import { PreviewAccessDialog } from "@/app/(app)/admin/users/[id]/preview-access-dialog";
import { CopyPermissionsDialog } from "@/app/(app)/admin/users/[id]/copy-permissions-dialog";
import { BackLink } from "@/components/shared/back-link";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();

  const [{ data: profile }, { data: member }, { data: roles }, { data: permissions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("event_members").select("*").eq("event_id", eventId).eq("user_id", id).single(),
    supabase.from("roles").select("*").order("name"),
    supabase.from("permissions").select("*").order("module"),
  ]);

  if (!profile || !member) notFound();

  const [{ data: roleGrants }, { data: overrides }, { data: otherMembers }] = await Promise.all([
    supabase.from("role_permissions").select("*").eq("role_id", member.role_id),
    supabase.from("user_permission_overrides").select("*").eq("event_id", eventId).eq("user_id", id),
    supabase.from("event_members").select("user_id").eq("event_id", eventId).neq("user_id", id),
  ]);

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);

  const roleGrantByPermission = new Map((roleGrants ?? []).map((g) => [g.permission_id, g]));
  const validOverrides = (overrides ?? []).filter((o) => !o.expires_at || new Date(o.expires_at) > new Date());
  const overrideByPermission = new Map(validOverrides.map((o) => [o.permission_id, o]));

  const effective: Record<string, { allowed: boolean; scope: string }> = {};
  for (const p of permissions ?? []) {
    const override = overrideByPermission.get(p.id);
    const roleGrant = roleGrantByPermission.get(p.id);
    effective[p.id] = {
      allowed: override ? override.allowed : (roleGrant?.allowed ?? false),
      scope: override?.scope ?? roleGrant?.scope ?? "none",
    };
  }

  const otherMemberIds = (otherMembers ?? []).map((m) => m.user_id);
  const { data: otherProfiles } =
    otherMemberIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", otherMemberIds) : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/users" label="Retour aux utilisateurs" />
      <UserDetailHeader
        member={member}
        profile={profile}
        roles={roles ?? []}
        email={authUser.user?.email ?? null}
        isSuperAdminActor={currentUser.profile.is_super_admin}
      />

      <div className="flex flex-wrap gap-2">
        <PreviewAccessDialog eventId={eventId} targetUserId={id} />
        <CopyPermissionsDialog
          eventId={eventId}
          targetUserId={id}
          otherMembers={(otherProfiles ?? []).map((p) => ({ userId: p.id, name: p.full_name }))}
        />
      </div>

      <PermissionMatrix eventId={eventId} targetUserId={id} permissions={permissions ?? []} effective={effective} />
    </div>
  );
}
