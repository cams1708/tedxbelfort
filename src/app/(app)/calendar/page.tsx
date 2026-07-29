import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { CalendarView } from "@/app/(app)/calendar/calendar-view";

export default async function CalendarPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("calendar_items")
    .select("*")
    .eq("event_id", eventId)
    .order("start_at", { ascending: true });

  const itemList = items ?? [];
  const { data: attendeeRows } =
    itemList.length > 0
      ? await supabase
          .from("calendar_item_attendees")
          .select("calendar_item_id")
          .in(
            "calendar_item_id",
            itemList.map((i) => i.id),
          )
          .eq("user_id", currentUser.profile.id)
      : { data: [] as { calendar_item_id: string }[] };

  const attendeeItemIds = new Set((attendeeRows ?? []).map((a) => a.calendar_item_id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendrier</h1>
        <p className="text-sm text-muted-foreground">Réunions, échéances, rendez-vous et jour J.</p>
      </div>
      <CalendarView items={itemList} currentUserId={currentUser.profile.id} attendeeItemIds={attendeeItemIds} />
    </div>
  );
}
