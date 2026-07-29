"use client";

import { useTransition } from "react";
import { setCurrentEventAction } from "@/lib/events/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/types/database.types";

export function EventSwitcher({ events, currentEventId }: { events: Tables<"events">[]; currentEventId: string }) {
  const [isPending, startTransition] = useTransition();

  if (events.length <= 1) {
    const event = events[0];
    return <span className="text-sm font-medium">{event?.name}</span>;
  }

  return (
    <Select
      disabled={isPending}
      value={currentEventId}
      onValueChange={(value) => {
        if (typeof value === "string") startTransition(() => setCurrentEventAction(value));
      }}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Choisir un événement" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
