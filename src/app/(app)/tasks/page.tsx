import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { TasksView } from "@/app/(app)/tasks/tasks-view";
import type { TaskRow } from "@/app/(app)/tasks/types";

export default async function TasksPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false });

  const taskList = tasks ?? [];
  const taskIds = taskList.map((t) => t.id);
  const ownerIds = Array.from(new Set(taskList.map((t) => t.owner_id).filter((id): id is string => !!id)));

  const [{ data: owners }, { data: assignees }] = await Promise.all([
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    taskIds.length > 0
      ? supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds).eq("user_id", currentUser.profile.id)
      : Promise.resolve({ data: [] as { task_id: string; user_id: string }[] }),
  ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));
  const assignedTaskIds = new Set((assignees ?? []).map((a) => a.task_id));

  const rows: TaskRow[] = taskList.map((t) => ({
    ...t,
    owner_name: t.owner_id ? (ownerById.get(t.owner_id) ?? null) : null,
    is_assignee: assignedTaskIds.has(t.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tâches</h1>
        <p className="text-sm text-muted-foreground">Organisation du travail de l’équipe.</p>
      </div>
      <TasksView tasks={rows} currentUserId={currentUser.profile.id} />
    </div>
  );
}
