import type { Tables } from "@/types/database.types";

type Transaction = Tables<"financial_transactions">;
type Category = Tables<"budget_categories">;

export interface CashflowMonthRow {
  monthKey: string; // "YYYY-MM"
  label: string; // "Janvier 2026"
  netMovements: number;
  forecastAdjustment: number;
  cumulativeBalance: number;
}

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/**
 * Buckets committed/realized movements by month, then folds the residual
 * "not yet committed" forecast gap (forecast_amount minus what's already
 * recorded, per category, rolled up to include sub-categories) into the
 * final month as a single projected adjustment — we don't have monthly
 * granularity on the forecast itself, so this is a deliberate simplification
 * rather than a false precision.
 */
export function buildCashflowProjection(
  transactions: Transaction[],
  categories: Category[],
  eventDateStr: string | null,
): CashflowMonthRow[] {
  const active = transactions.filter((t) => t.status !== "cancelled");

  const now = new Date();
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;

  const months = new Map<string, number>();
  const startMonth = monthKey(now);
  months.set(startMonth, 0);

  if (eventDate && eventDate > now) {
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
    while (cursor <= end) {
      months.set(monthKey(cursor), months.get(monthKey(cursor)) ?? 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  for (const t of active) {
    const d = new Date(t.transaction_date);
    const key = monthKey(d);
    const signed = t.type === "revenue" ? Number(t.amount_ttc) : -Number(t.amount_ttc);
    months.set(key, (months.get(key) ?? 0) + signed);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const c of categories) {
    if (c.parent_category_id) {
      childrenByParent.set(c.parent_category_id, [...(childrenByParent.get(c.parent_category_id) ?? []), c.id]);
    }
  }

  let forecastAdjustment = 0;
  for (const c of categories.filter((c) => c.parent_category_id === null)) {
    const idsInGroup = [c.id, ...(childrenByParent.get(c.id) ?? [])];
    const committed = active
      .filter((t) => t.category_id && idsInGroup.includes(t.category_id))
      .reduce((s, t) => s + Number(t.amount_ttc), 0);
    const residual = Number(c.forecast_amount) - committed;
    if (residual > 0) {
      forecastAdjustment += c.kind === "revenue" ? residual : -residual;
    }
  }

  const sortedKeys = Array.from(months.keys()).sort();
  const lastKey = sortedKeys[sortedKeys.length - 1];

  let cumulative = 0;
  return sortedKeys.map((key) => {
    const netMovements = months.get(key) ?? 0;
    const adjustment = key === lastKey ? forecastAdjustment : 0;
    cumulative += netMovements + adjustment;
    return {
      monthKey: key,
      label: monthLabel(key),
      netMovements,
      forecastAdjustment: adjustment,
      cumulativeBalance: cumulative,
    };
  });
}
