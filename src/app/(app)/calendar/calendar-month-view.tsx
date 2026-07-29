"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/types/database.types";

const TYPE_LABELS: Record<string, string> = {
  meeting: "Réunion",
  followup: "Relance",
  deadline: "Échéance",
  rehearsal: "Répétition",
  partner_appointment: "RDV partenaire",
  speaker_appointment: "RDV speaker",
  payment_date: "Paiement",
  contractual_deadline: "Échéance contrat",
  internal: "Interne",
  d_day: "Jour J",
};

export function CalendarMonthView({ items }: { items: Tables<"calendar_items">[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, Tables<"calendar_items">[]>();
    for (const item of items) {
      const key = format(new Date(item.start_at), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{format(month, "MMMM yyyy", { locale: fr })}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-24 flex-col gap-1 rounded-md border p-1.5 text-xs",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground",
                isToday(day) && "border-primary",
              )}
            >
              <span className={cn("font-medium", isToday(day) && "text-primary")}>{format(day, "d")}</span>
              {dayItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="truncate rounded bg-muted px-1 py-0.5"
                  title={`${TYPE_LABELS[item.type] ?? item.type} — ${item.title}`}
                >
                  {item.title}
                </span>
              ))}
              {dayItems.length > 3 ? <span className="text-muted-foreground">+{dayItems.length - 3}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
