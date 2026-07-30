"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv, type ExportColumn } from "@/lib/export/csv";
import { downloadXlsx } from "@/lib/export/xlsx";
import { Download } from "lucide-react";

export function ExportButton<T>({
  filename,
  sheetName,
  rows,
  columns,
}: {
  filename: string;
  sheetName: string;
  rows: T[];
  columns: ExportColumn<T>[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="size-3.5" /> Exporter
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadCsv(`${filename}.csv`, rows, columns)}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadXlsx(`${filename}.xlsx`, sheetName, rows, columns)}>
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
