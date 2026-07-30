import { downloadCsv, prepareExportRows, type ExportColumn } from "@/lib/export/csv";
import { TRANSACTION_STATUS_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";

type Transaction = Tables<"financial_transactions">;

interface AccountingRow {
  date: string;
  label: string;
  category: string;
  debit: number | null;
  credit: number | null;
  amountTtc: number;
  status: string;
}

/**
 * A negated expense (a credit note's reversal) belongs in the crédit column,
 * not as a negative débit — and symmetrically for a negated revenue entry.
 */
function toAccountingRow(t: Transaction, categoryName: string): AccountingRow {
  const amount = Number(t.amount_ttc);
  const isDebitSide = t.type === "expense" ? amount >= 0 : amount < 0;
  return {
    date: t.transaction_date,
    label: t.title,
    category: categoryName,
    debit: isDebitSide ? Math.abs(amount) : null,
    credit: isDebitSide ? null : Math.abs(amount),
    amountTtc: amount,
    status: TRANSACTION_STATUS_LABELS[t.status]?.label ?? t.status,
  };
}

const columns: ExportColumn<AccountingRow>[] = [
  { label: "Date", value: (r) => r.date },
  { label: "Libellé", value: (r) => r.label },
  { label: "Catégorie", value: (r) => r.category },
  { label: "Débit", value: (r) => r.debit ?? "" },
  { label: "Crédit", value: (r) => r.credit ?? "" },
  { label: "Montant TTC", value: (r) => r.amountTtc },
  { label: "Statut", value: (r) => r.status },
];

export function downloadAccountingExport(
  filename: string,
  transactions: Transaction[],
  categoryNameById: Map<string, string>,
): void {
  const rows = transactions
    .filter((t) => t.status !== "cancelled")
    .map((t) => toAccountingRow(t, t.category_id ? (categoryNameById.get(t.category_id) ?? "—") : "—"));
  const { headers, data } = prepareExportRows(rows, columns);
  downloadCsv(filename, headers, data);
}
