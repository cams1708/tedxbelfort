import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { PartnersView } from "@/app/(app)/partners/partners-view";
import type { PartnerRow } from "@/app/(app)/partners/types";

export default async function PartnersPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();

  const [{ data: event }, { data: partners }] = await Promise.all([
    supabase.from("events").select("currency").eq("id", eventId).single(),
    supabase.from("partners").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
  ]);

  const partnerList = partners ?? [];
  const ownerIds = Array.from(new Set(partnerList.map((p) => p.owner_id).filter((id): id is string => !!id)));

  const [{ data: owners }, { data: amounts }, { data: teamMembers }] = await Promise.all([
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    currentUser.profile.is_super_admin || can(currentUser.permissions, "partners", "view_amounts")
      ? supabase
          .from("partner_amounts")
          .select("partner_id, amount_confirmed, amount_expected")
          .in(
            "partner_id",
            partnerList.map((p) => p.id),
          )
      : Promise.resolve({ data: [] as { partner_id: string; amount_confirmed: number | null; amount_expected: number | null }[] }),
    supabase
      .from("team_members")
      .select("id, first_name, last_name")
      .eq("event_id", eventId)
      .order("first_name"),
  ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));
  const amountsByPartner = new Map((amounts ?? []).map((a) => [a.partner_id, a]));
  const teamMemberList = teamMembers ?? [];
  const teamMemberById = new Map(teamMemberList.map((m) => [m.id, `${m.first_name} ${m.last_name}`]));

  const rows: PartnerRow[] = partnerList.map((p) => ({
    ...p,
    owner_name: p.owner_id ? (ownerById.get(p.owner_id) ?? null) : null,
    assigned_team_member_name: p.assigned_team_member_id
      ? (teamMemberById.get(p.assigned_team_member_id) ?? null)
      : null,
    amount_confirmed: amountsByPartner.get(p.id)?.amount_confirmed ?? null,
    amount_expected: amountsByPartner.get(p.id)?.amount_expected ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Partenaires</h1>
        <p className="text-sm text-muted-foreground">Suivi de la prospection et des partenariats.</p>
      </div>
      <PartnersView partners={rows} currency={event?.currency ?? "EUR"} teamMembers={teamMemberList} />
    </div>
  );
}
