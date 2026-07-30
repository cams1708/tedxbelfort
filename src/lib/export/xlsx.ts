import * as XLSX from "xlsx";
import { getRawValue, type ExportColumn } from "@/lib/export/csv";

export function downloadXlsx<T>(filename: string, sheetName: string, rows: T[], columns: ExportColumn<T>[]): void {
  const data = rows.map((row) => Object.fromEntries(columns.map((c) => [c.label, getRawValue(row, c) ?? ""])));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  // Excel sheet names are capped at 31 characters.
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
