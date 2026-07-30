import { getRawValue, type ExportColumn } from "@/lib/export/csv";

/**
 * Loaded only on click, inside the browser — never at module top-level.
 * A static import would still run xlsx's module-init code during Next.js's
 * server-side render of the client component tree, not just in-browser.
 */
export async function downloadXlsx<T>(filename: string, sheetName: string, rows: T[], columns: ExportColumn<T>[]): Promise<void> {
  const XLSX = await import("xlsx");
  const data = rows.map((row) => Object.fromEntries(columns.map((c) => [c.label, getRawValue(row, c) ?? ""])));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  // Excel sheet names are capped at 31 characters.
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
