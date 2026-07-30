import type { ExportRow } from "@/lib/export/csv";

/**
 * Loaded only on click, inside the browser — never at module top-level.
 * A static import would still run xlsx's module-init code during Next.js's
 * server-side render of the client component tree, not just in-browser.
 */
export async function downloadXlsx(filename: string, sheetName: string, headers: string[], data: ExportRow[]): Promise<void> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  // Excel sheet names are capped at 31 characters.
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
