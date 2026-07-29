"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { TaskFormDialog } from "@/app/(app)/tasks/task-form-dialog";
import { usePermissions } from "@/lib/permissions/context";
import type { TaskRow } from "@/app/(app)/tasks/types";

export function TasksTable({ tasks }: { tasks: TaskRow[] }) {
  const { can } = usePermissions();
  const canEdit = can("tasks", "edit");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Titre <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) =>
          canEdit ? (
            <TaskFormDialog
              task={row.original}
              trigger={
                <button type="button" className="text-left font-medium hover:underline">
                  {row.original.title}
                </button>
              }
            />
          ) : (
            <span className="font-medium">{row.original.title}</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const meta = TASK_STATUS_LABELS[row.original.status];
          return <StatusBadge label={meta.label} tone={meta.tone} />;
        },
      },
      {
        accessorKey: "priority",
        header: "Priorité",
        cell: ({ row }) => {
          const meta = TASK_PRIORITY_LABELS[row.original.priority];
          return <StatusBadge label={meta.label} tone={meta.tone} />;
        },
      },
      {
        accessorKey: "owner_name",
        header: "Responsable",
        cell: ({ row }) => row.original.owner_name ?? <span className="text-muted-foreground">Non attribué</span>,
      },
      {
        accessorKey: "due_date",
        header: "Échéance",
        cell: ({ row }) => (row.original.due_date ? new Date(row.original.due_date).toLocaleDateString("fr-FR") : "—"),
      },
    ],
    [canEdit],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Rechercher une tâche…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-xs"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucune tâche.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
