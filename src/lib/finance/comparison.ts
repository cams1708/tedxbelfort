import type { Tables, TransactionType } from "@/types/database.types";

type Transaction = Tables<"financial_transactions">;
type Category = Tables<"budget_categories">;

export interface CategoryComparisonRow {
  id: string;
  name: string;
  kind: TransactionType;
  isSubCategory: boolean;
  forecast: number;
  engaged: number;
  invoiced: number;
  paid: number;
  gapAmount: number;
  gapPercent: number | null;
}

/**
 * engagé/facturé/payé are a waterfall over the SAME commitment, not three
 * independently-summable pots — a partially-paid invoice contributes its
 * paid portion to "payé" and only the remaining unpaid portion to "facturé",
 * never the full amount to both (that would double-count it in the gap).
 * `paidAmountByInvoiceId` must come from invoice_effective_amounts, the only
 * accurate source for "paid so far" on an invoice-linked transaction.
 */
export function buildBudgetComparison(
  categories: Category[],
  transactions: Transaction[],
  paidAmountByInvoiceId: Map<string, number>,
): CategoryComparisonRow[] {
  const active = transactions.filter((t) => t.status !== "cancelled" && t.status !== "planned");

  function bucketsFor(t: Transaction): { engaged: number; invoiced: number; paid: number } {
    const amount = Number(t.amount_ttc);
    if (t.status === "engaged") {
      return { engaged: amount, invoiced: 0, paid: 0 };
    }
    const paidPortion = t.invoice_id ? Math.min(paidAmountByInvoiceId.get(t.invoice_id) ?? 0, amount) : 0;
    if (t.status === "paid") {
      return { engaged: 0, invoiced: 0, paid: t.invoice_id ? paidPortion : amount };
    }
    // invoiced / overdue
    return { engaged: 0, invoiced: amount - paidPortion, paid: paidPortion };
  }

  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parent_category_id) {
      childrenByParent.set(c.parent_category_id, [...(childrenByParent.get(c.parent_category_id) ?? []), c]);
    }
  }

  function computeRow(cat: Category, rollupIds: string[]): CategoryComparisonRow {
    const rows = active.filter((t) => t.category_id && rollupIds.includes(t.category_id));
    let engaged = 0;
    let invoiced = 0;
    let paid = 0;
    for (const t of rows) {
      const b = bucketsFor(t);
      engaged += b.engaged;
      invoiced += b.invoiced;
      paid += b.paid;
    }
    const forecast = Number(cat.forecast_amount);
    const gapAmount = engaged + invoiced + paid - forecast;
    const gapPercent = forecast !== 0 ? (gapAmount / forecast) * 100 : null;
    return {
      id: cat.id,
      name: cat.name,
      kind: cat.kind,
      isSubCategory: cat.parent_category_id !== null,
      forecast,
      engaged,
      invoiced,
      paid,
      gapAmount,
      gapPercent,
    };
  }

  const rows: CategoryComparisonRow[] = [];
  for (const cat of categories.filter((c) => c.parent_category_id === null)) {
    const children = childrenByParent.get(cat.id) ?? [];
    rows.push(computeRow(cat, [cat.id, ...children.map((c) => c.id)]));
    for (const child of children) {
      rows.push(computeRow(child, [child.id]));
    }
  }
  return rows;
}
