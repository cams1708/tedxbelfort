"use client";

import { useOptimistic, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";
import { usePermissions } from "@/lib/permissions/context";
import type { TaskRow } from "@/app/(app)/tasks/types";
import type { TaskStatus } from "@/types/database.types";

const COLUMNS = Object.keys(TASK_STATUS_LABELS) as TaskStatus[];

function TaskCard({ task }: { task: TaskRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const priority = TASK_PRIORITY_LABELS[task.priority];

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-40" : undefined}>
      <Card className="cursor-grab gap-2 p-3 active:cursor-grabbing">
        <span className="text-sm font-medium">{task.title}</span>
        <div className="flex items-center justify-between">
          <StatusBadge label={priority.label} tone={priority.tone} />
          {task.owner_name ? <span className="text-xs text-muted-foreground">{task.owner_name}</span> : null}
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: TaskRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = TASK_STATUS_LABELS[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2 ${isOver ? "ring-2 ring-ring" : ""}`}
    >
      <div className="flex items-center justify-between px-1">
        <StatusBadge label={meta.label} tone={meta.tone} />
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function TasksKanban({ tasks }: { tasks: TaskRow[] }) {
  const { can } = usePermissions();
  const canChangeStatus = can("tasks", "change_status");
  const [, startTransition] = useTransition();
  const [optimisticTasks, setOptimisticStatus] = useOptimistic(
    tasks,
    (state, { id, status }: { id: string; status: TaskStatus }) =>
      state.map((t) => (t.id === id ? { ...t, status } : t)),
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    if (!canChangeStatus) return;
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const task = optimisticTasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;

    startTransition(() => {
      setOptimisticStatus({ id: task.id, status: newStatus });
      void updateTaskStatusAction(task.id, newStatus);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn key={status} status={status} tasks={optimisticTasks.filter((t) => t.status === status)} />
        ))}
      </div>
    </DndContext>
  );
}
