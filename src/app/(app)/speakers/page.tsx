import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { SpeakersTable } from "@/app/(app)/speakers/speakers-table";
import { SpeakerFormDialog } from "@/app/(app)/speakers/speaker-form-dialog";
import { Can } from "@/lib/permissions/context";
import type { SpeakerRow } from "@/app/(app)/speakers/types";

export default async function SpeakersPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();
  const { data: speakers } = await supabase
    .from("speakers")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const speakerList = speakers ?? [];
  const ownerIds = Array.from(new Set(speakerList.map((s) => s.owner_id).filter((id): id is string => !!id)));

  const { data: owners } =
    ownerIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
      : { data: [] as { id: string; full_name: string }[] };

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));
  const rows: SpeakerRow[] = speakerList.map((s) => ({
    ...s,
    owner_name: s.owner_id ? (ownerById.get(s.owner_id) ?? null) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Speakers</h1>
          <p className="text-sm text-muted-foreground">Recrutement et suivi de la préparation des talks.</p>
        </div>
        <Can module="speakers" action="create">
          <SpeakerFormDialog />
        </Can>
      </div>
      <SpeakersTable speakers={rows} />
    </div>
  );
}
