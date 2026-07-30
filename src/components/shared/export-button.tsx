"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv, type ExportRow } from "@/lib/export/csv";
import { downloadXlsx } from "@/lib/export/xlsx";
import { Download } from "lucide-react";

export function ExportButton({
  filename,
  sheetName,
  headers,
  data,
}: {
  filename: string;
  sheetName: string;
  headers: string[];
  data: ExportRow[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="size-3.5" /> Exporter
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadCsv(`${filename}.csv`, headers, data)}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void downloadXlsx(`${filename}.xlsx`, sheetName, headers, data)}>
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
