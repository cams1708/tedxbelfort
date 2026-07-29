"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarMonthView } from "@/app/(app)/calendar/calendar-month-view";
import { CalendarFormDialog } from "@/app/(app)/calendar/calendar-form-dialog";
import { Can } from "@/lib/permissions/context";
import type { Tables } from "@/types/database.types";

export function CalendarView({
  items,
  currentUserId,
  attendeeItemIds,
}: {
  items: Tables<"calendar_items">[];
  currentUserId: string;
  attendeeItemIds: Set<string>;
}) {
  const [view, setView] = useState("all");

  const myItems = useMemo(
    () => items.filter((i) => i.owner_id === currentUserId || attendeeItemIds.has(i.id)),
    [items, currentUserId, attendeeItemIds],
  );

  return (
    <Tabs value={view} onValueChange={(v) => typeof v === "string" && setView(v)} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="all">Calendrier</TabsTrigger>
          <TabsTrigger value="mine">Mon calendrier</TabsTrigger>
        </TabsList>
        <Can module="calendar" action="create">
          <CalendarFormDialog />
        </Can>
      </div>
      <TabsContent value="all">
        <CalendarMonthView items={items} />
      </TabsContent>
      <TabsContent value="mine">
        <CalendarMonthView items={myItems} />
      </TabsContent>
    </Tabs>
  );
}
