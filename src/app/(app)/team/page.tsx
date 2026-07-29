import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Can } from "@/lib/permissions/context";
import { TeamFormDialog } from "@/app/(app)/team/team-form-dialog";
import { TeamMemberSheet } from "@/app/(app)/team/team-member-sheet";
import { TEAM_POLE_LABELS } from "@/lib/labels";

export default async function TeamPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canViewPersonal = hasAll || can(currentUser.permissions, "team", "view_personal_data");
  const canEdit = hasAll || can(currentUser.permissions, "team", "edit");
  const canDelete = hasAll || can(currentUser.permissions, "team", "delete");

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("event_id", eventId)
    .order("pole", { ascending: true });

  const memberList = members ?? [];

  // RLS returns each row the user is allowed to see: every row if they hold
  // team.view_personal_data, or just their own row via the self-service
  // policy otherwise — no need to branch on the permission here.
  const { data: privateRows } =
    memberList.length > 0
      ? await supabase
          .from("team_member_private")
          .select("*")
          .in(
            "team_member_id",
            memberList.map((m) => m.id),
          )
      : { data: [] as { team_member_id: string; email: string | null; phone: string | null; admin_confidential_notes: string | null }[] };

  const privateByMember = new Map((privateRows ?? []).map((p) => [p.team_member_id, p]));

  const { data: eventMembers } = await supabase.from("event_members").select("user_id").eq("event_id", eventId);
  const accountIds = (eventMembers ?? []).map((m) => m.user_id);
  const { data: accountProfiles } =
    accountIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", accountIds).order("full_name")
      : { data: [] as { id: string; full_name: string }[] };
  const accounts = accountProfiles ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Équipe</h1>
          <p className="text-sm text-muted-foreground">Membres de l’équipe et bénévoles.</p>
        </div>
        <Can module="team" action="create">
          <TeamFormDialog accounts={accounts} />
        </Can>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Pôle</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Disponibilités</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Aucun membre pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              memberList.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <TeamMemberSheet
                      member={member}
                      privateData={privateByMember.get(member.id) ?? null}
                      canViewPersonal={canViewPersonal}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      isSelf={member.profile_id === currentUser.profile.id}
                      accounts={accounts}
                    />
                  </TableCell>
                  <TableCell>{TEAM_POLE_LABELS[member.pole]}</TableCell>
                  <TableCell>{member.role_label ?? "—"}</TableCell>
                  <TableCell>{member.availability ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
