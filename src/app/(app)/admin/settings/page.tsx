import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { EventSettingsForm } from "@/app/(app)/admin/settings/event-settings-form";
import { BankDetailsForm } from "@/app/(app)/admin/settings/bank-details-form";

export default async function AdminSettingsPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "settings", "view");
  const canEdit = hasAll || can(currentUser.permissions, "settings", "edit");
  const canViewBank = hasAll || can(currentUser.permissions, "budget", "view_bank_details");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Paramètres</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Vous n’avez pas accès aux paramètres de l’événement.</p>
        <RequestAccessButton resourceType="settings" permissionRequested="settings.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: event }, bankDetails] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single(),
    canViewBank
      ? supabase.from("event_bank_details").select("*").eq("event_id", eventId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Informations générales de l’événement.</p>
      </div>
      <EventSettingsForm event={event} canEdit={canEdit} />
      <BankDetailsForm eventId={eventId} data={bankDetails.data} canView={canViewBank} canEdit={canEdit} />
    </div>
  );
}
