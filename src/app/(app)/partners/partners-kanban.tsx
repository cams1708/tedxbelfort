"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PARTNER_PRIORITY_LABELS, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { updatePartnerStatusAction } from "@/app/(app)/partners/actions";
import { usePermissions } from "@/lib/permissions/context";
import type { PartnerRow } from "@/app/(app)/partners/types";
import type { PartnerStatus } from "@/types/database.types";

const COLUMNS = Object.keys(PARTNER_STATUS_LABELS) as PartnerStatus[];

function PartnerCard({ partner }: { partner: PartnerRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: partner.id });
  const priority = PARTNER_PRIORITY_LABELS[partner.priority];

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-40" : undefined}>
      <Card className="cursor-grab gap-2 p-3 active:cursor-grabbing">
        <Link href={`/partners/${partner.id}`} className="text-sm font-medium hover:underline">
          {partner.company_name}
        </Link>
        <div className="flex items-center justify-between">
          <StatusBadge label={priority.label} tone={priority.tone} />
          {partner.assigned_team_member_name ? (
            <span className="text-xs text-muted-foreground">{partner.assigned_team_member_name}</span>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({ status, partners }: { status: PartnerStatus; partners: PartnerRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = PARTNER_STATUS_LABELS[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2 ${isOver ? "ring-2 ring-ring" : ""}`}
    >
      <div className="flex items-center justify-between px-1">
        <StatusBadge label={meta.label} tone={meta.tone} />
        <span className="text-xs text-muted-foreground">{partners.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </div>
  );
}

export function PartnersKanban({ partners }: { partners: PartnerRow[] }) {
  const { can } = usePermissions();
  const canChangeStatus = can("partners", "change_status");
  const [, startTransition] = useTransition();
  const [optimisticPartners, setOptimisticStatus] = useOptimistic(
    partners,
    (state, { id, status }: { id: string; status: PartnerStatus }) =>
      state.map((p) => (p.id === id ? { ...p, status } : p)),
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    if (!canChangeStatus) return;
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as PartnerStatus;
    const partner = optimisticPartners.find((p) => p.id === active.id);
    if (!partner || partner.status === newStatus) return;

    startTransition(() => {
      setOptimisticStatus({ id: partner.id, status: newStatus });
      updatePartnerStatusAction(partner.id, newStatus);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            partners={optimisticPartners.filter((p) => p.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
