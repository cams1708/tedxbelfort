export interface ExportColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

export type ExportRow = Record<string, string | number>;

/**
 * Server-side only: turns typed rows + column definitions (which carry
 * functions) into plain, serializable {headers, data} — functions can't be
 * passed as props from a Server Component to a Client Component, so this
 * must run before the result ever reaches one.
 */
export function prepareExportRows<T>(rows: T[], columns: ExportColumn<T>[]): { headers: string[]; data: ExportRow[] } {
  const headers = columns.map((c) => c.label);
  const data = rows.map((row) => {
    const obj: ExportRow = {};
    for (const c of columns) {
      obj[c.label] = c.value(row) ?? "";
    }
    return obj;
  });
  return { headers, data };
}

function escapeCsvCell(value: string): string {
  if (/[",;\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Semicolon-delimited, not comma — the fr-FR Excel locale uses comma as the
 * decimal separator, so a comma-delimited CSV opens with garbled columns.
 * UTF-8 BOM prefix avoids mojibake on accented characters.
 */
export function toCsv(headers: string[], data: ExportRow[]): string {
  const headerLine = headers.map(escapeCsvCell).join(";");
  const lines = data.map((row) => headers.map((h) => escapeCsvCell(String(row[h] ?? ""))).join(";"));
  return [headerLine, ...lines].join("\r\n");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], data: ExportRow[]): void {
  const csv = toCsv(headers, data);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
