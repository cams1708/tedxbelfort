import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { InviteUserDialog } from "@/app/(app)/admin/users/invite-dialog";
import { ResendLinkButton } from "@/app/(app)/admin/users/resend-link-button";
import { AccessRequestsPanel } from "@/app/(app)/admin/users/access-requests-panel";
import Link from "next/link";

export default async function AdminUsersPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "users", "view");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Utilisateurs et accès</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vous n’avez pas accès à la gestion des utilisateurs de cet événement.
        </p>
        <RequestAccessButton resourceType="users" permissionRequested="users.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: members }, { data: roles }, { data: pendingRequests }] = await Promise.all([
    supabase.from("event_members").select("*").eq("event_id", eventId),
    supabase.from("roles").select("*").order("name"),
    supabase.from("access_requests").select("*").eq("event_id", eventId).eq("status", "pending"),
  ]);

  const memberList = members ?? [];
  const userIds = memberList.map((m) => m.user_id);

  const { data: profiles } = userIds.length > 0 ? await supabase.from("profiles").select("*").in("id", userIds) : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const roleById = new Map((roles ?? []).map((r) => [r.id, r]));
  const systemRoles = (roles ?? []).filter((r) => r.event_id === null);

  const emailByUserId = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.email) emailByUserId.set(id, data.user.email);
    }),
  );

  const requesterIds = (pendingRequests ?? []).map((r) => r.user_id);
  const { data: requesterProfiles } =
    requesterIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", requesterIds) : { data: [] };
  const requesterNameById = new Map((requesterProfiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Utilisateurs et accès</h1>
          <p className="text-sm text-muted-foreground">Gestion des comptes, rôles et permissions.</p>
        </div>
        {hasAll || can(currentUser.permissions, "users", "create") ? <InviteUserDialog roles={systemRoles} /> : null}
      </div>

      <AccessRequestsPanel
        requests={(pendingRequests ?? []).map((r) => ({
          id: r.id,
          requester_name: requesterNameById.get(r.user_id) ?? "Utilisateur",
          permission_requested: r.permission_requested,
          reason: r.reason,
          created_at: r.created_at,
        }))}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière connexion</TableHead>
              {hasAll ? <TableHead className="text-right">Lien</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAll ? 6 : 5} className="h-24 text-center text-muted-foreground">
                  Aucun utilisateur pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              memberList.map((member) => {
                const profile = profileById.get(member.user_id);
                const role = roleById.get(member.role_id);
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link href={`/admin/users/${member.user_id}`} className="font-medium hover:underline">
                        {profile?.full_name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emailByUserId.get(member.user_id) ?? "—"}</TableCell>
                    <TableCell>{role?.name ?? "—"}</TableCell>
                    <TableCell>
                      {profile?.is_active === false ? (
                        <StatusBadge label="Compte désactivé" tone="danger" />
                      ) : member.status === "inactive" ? (
                        <StatusBadge label="Accès désactivé" tone="warning" />
                      ) : (
                        <StatusBadge label="Actif" tone="success" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile?.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString("fr-FR") : "Jamais connecté"}
                    </TableCell>
                    {hasAll ? (
                      <TableCell className="text-right">
                        {emailByUserId.get(member.user_id) ? (
                          <ResendLinkButton email={emailByUserId.get(member.user_id)!} />
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
