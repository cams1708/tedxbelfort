export interface ExportColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

export function getRawValue<T>(row: T, col: ExportColumn<T>): string | number | null | undefined {
  return col.value(row);
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
export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(";");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(String(getRawValue(row, c) ?? ""))).join(";"),
  );
  return [header, ...lines].join("\r\n");
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

export function downloadCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]): void {
  const csv = toCsv(rows, columns);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
