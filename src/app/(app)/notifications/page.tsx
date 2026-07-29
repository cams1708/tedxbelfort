import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/app/(app)/notifications/notifications-list";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Tâches attribuées, relances, demandes d’accès et échéances.</p>
      </div>
      <NotificationsList notifications={notifications ?? []} />
    </div>
  );
}
