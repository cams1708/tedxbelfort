"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksTable } from "@/app/(app)/tasks/tasks-table";
import { TasksKanban } from "@/app/(app)/tasks/tasks-kanban";
import { TaskFormDialog } from "@/app/(app)/tasks/task-form-dialog";
import { Can } from "@/lib/permissions/context";
import type { TaskRow } from "@/app/(app)/tasks/types";

export function TasksView({ tasks, currentUserId }: { tasks: TaskRow[]; currentUserId: string }) {
  const [view, setView] = useState("list");

  const myTasks = useMemo(
    () => tasks.filter((t) => t.owner_id === currentUserId || t.is_assignee),
    [tasks, currentUserId],
  );
  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled");
  }, [tasks]);

  return (
    <Tabs value={view} onValueChange={(v) => typeof v === "string" && setView(v)} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="mine">Mes tâches</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>
        <Can module="tasks" action="create">
          <TaskFormDialog />
        </Can>
      </div>

      <TabsContent value="list">
        <TasksTable tasks={tasks} />
      </TabsContent>
      <TabsContent value="kanban">
        <TasksKanban tasks={tasks} />
      </TabsContent>
      <TabsContent value="mine">
        <TasksTable tasks={myTasks} />
      </TabsContent>
      <TabsContent value="overdue">
        <TasksTable tasks={overdueTasks} />
      </TabsContent>
    </Tabs>
  );
}
