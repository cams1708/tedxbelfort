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
import { PARTNER_PRIORITY_LABELS, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { usePermissions } from "@/lib/permissions/context";
import type { PartnerRow } from "@/app/(app)/partners/types";

export function PartnersTable({ partners, currency }: { partners: PartnerRow[]; currency: string }) {
  const { can } = usePermissions();
  const canViewAmounts = can("partners", "view_amounts");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const formatAmount = (value: number | null) =>
    value === null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  const columns = useMemo<ColumnDef<PartnerRow>[]>(() => {
    const base: ColumnDef<PartnerRow>[] = [
      {
        accessorKey: "company_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Entreprise <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link href={`/partners/${row.original.id}`} className="font-medium hover:underline">
            {row.original.company_name}
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const meta = PARTNER_STATUS_LABELS[row.original.status];
          return <StatusBadge label={meta.label} tone={meta.tone} />;
        },
      },
      {
        accessorKey: "priority",
        header: "Priorité",
        cell: ({ row }) => {
          const meta = PARTNER_PRIORITY_LABELS[row.original.priority];
          return <StatusBadge label={meta.label} tone={meta.tone} />;
        },
      },
      {
        accessorKey: "assigned_team_member_name",
        header: "Responsable",
        cell: ({ row }) =>
          row.original.assigned_team_member_name ?? <span className="text-muted-foreground">Non attribué</span>,
      },
      {
        accessorKey: "next_followup_date",
        header: "Prochaine relance",
        cell: ({ row }) =>
          row.original.next_followup_date ? new Date(row.original.next_followup_date).toLocaleDateString("fr-FR") : "—",
      },
    ];

    if (canViewAmounts) {
      base.push({
        accessorKey: "amount_confirmed",
        header: "Montant confirmé",
        cell: ({ row }) => formatAmount(row.original.amount_confirmed),
      });
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAmounts, currency]);

  const table = useReactTable({
    data: partners,
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
        placeholder="Rechercher un partenaire…"
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
                  Aucun partenaire pour le moment.
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
