import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Card, CardContent } from "@/components/ui/card";
import { TeamMemberPrivateCard } from "@/app/(app)/team/team-member-private-card";
import { TEAM_POLE_LABELS } from "@/lib/labels";

/**
 * Always reachable regardless of the `team` module permission — every team
 * member can view and complete their own contact details here, even a
 * Bénévole with no general team.view access.
 */
export default async function MyTeamProfilePage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("team_members")
    .select("*")
    .eq("event_id", eventId)
    .eq("profile_id", currentUser.profile.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!member) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mes coordonnées</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte n’est pas encore relié à une fiche dans l’équipe. Demandez à une administratrice de vous
          ajouter au module Équipe et de relier votre compte utilisateur à votre fiche.
        </p>
      </div>
    );
  }

  const { data: privateData } = await supabase
    .from("team_member_private")
    .select("*")
    .eq("team_member_id", member.id)
    .maybeSingle();

  const canViewPersonal = currentUser.profile.is_super_admin || can(currentUser.permissions, "team", "view_personal_data");
  const canEdit = currentUser.profile.is_super_admin || can(currentUser.permissions, "team", "edit");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes coordonnées</h1>
        <p className="text-sm text-muted-foreground">
          Visible par les personnes autorisées à consulter les données personnelles de l’équipe.
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 pt-6 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Nom</div>
            <div>
              {member.first_name} {member.last_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Pôle</div>
            <div>{TEAM_POLE_LABELS[member.pole]}</div>
          </div>
        </CardContent>
      </Card>

      <TeamMemberPrivateCard
        memberId={member.id}
        data={privateData ?? null}
        canView={canViewPersonal}
        canEdit={canEdit}
        isSelf
      />
    </div>
  );
}
