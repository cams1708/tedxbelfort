"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { SPEAKER_STATUS_LABELS } from "@/lib/labels";
import type { SpeakerRow } from "@/app/(app)/speakers/types";

export function SpeakersTable({ speakers }: { speakers: SpeakerRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<SpeakerRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link href={`/speakers/${row.original.id}`} className="font-medium hover:underline">
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      {
        accessorKey: "talk_title",
        header: "Talk",
        cell: ({ row }) => row.original.talk_title || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const meta = SPEAKER_STATUS_LABELS[row.original.status];
          return <StatusBadge label={meta.label} tone={meta.tone} />;
        },
      },
      {
        accessorKey: "owner_name",
        header: "Responsable",
        cell: ({ row }) => row.original.owner_name ?? <span className="text-muted-foreground">Non attribué</span>,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: speakers,
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
        placeholder="Rechercher un speaker…"
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
                  Aucun speaker pour le moment.
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
