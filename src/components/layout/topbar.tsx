import { EventSwitcher } from "@/components/layout/event-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Tables } from "@/types/database.types";

export function Topbar({ events, currentEventId }: { events: Tables<"events">[]; currentEventId: string }) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <EventSwitcher events={events} currentEventId={currentEventId} />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsBell />
        <UserMenu />
      </div>
    </header>
  );
}
