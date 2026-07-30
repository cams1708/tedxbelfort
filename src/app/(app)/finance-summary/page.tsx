import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { StatCard } from "@/components/shared/stat-card";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { AccountingExportButton } from "@/app/(app)/finance-summary/accounting-export-button";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Landmark, Scale } from "lucide-react";
import type { Tables } from "@/types/database.types";

type Transaction = Tables<"financial_transactions">;

/**
 * The only correct source for "paid so far" on an invoice-linked
 * transaction is invoice_effective_amounts (invoice_payments) — never the
 * synced transaction's own amount_ttc/status, which always carries the full
 * invoice amount regardless of partial payments.
 */
function paidAmount(t: Transaction, paidByInvoiceId: Map<string, number>): number {
  if (t.invoice_id) return Math.min(paidByInvoiceId.get(t.invoice_id) ?? 0, Number(t.amount_ttc));
  return t.status === "paid" ? Number(t.amount_ttc) : 0;
}

function remainingAmount(t: Transaction, paidByInvoiceId: Map<string, number>): number {
  if (t.status === "engaged") return Number(t.amount_ttc);
  return Math.max(Number(t.amount_ttc) - paidAmount(t, paidByInvoiceId), 0);
}

export default async function FinanceSummaryPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "budget", "view");
  const canExport = hasAll || can(currentUser.permissions, "budget", "export");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Synthèse financière</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vous n’avez pas accès aux informations financières de cet événement.
        </p>
        <RequestAccessButton resourceType="budget" permissionRequested="budget.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: event }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("events").select("currency, budget_forecast").eq("id", eventId).single(),
    supabase.from("budget_categories").select("*").eq("event_id", eventId),
    supabase.from("financial_transactions").select("*").eq("event_id", eventId),
  ]);

  const currency = event?.currency ?? "EUR";
  const categoryList = categories ?? [];
  const transactionList = (transactions ?? []).filter((t) => t.status !== "cancelled");

  const invoiceIds = Array.from(new Set(transactionList.map((t) => t.invoice_id).filter((id): id is string => !!id)));
  const { data: effectiveAmounts } =
    invoiceIds.length > 0
      ? await supabase.from("invoice_effective_amounts").select("invoice_id, total_paid").in("invoice_id", invoiceIds)
      : { data: [] as { invoice_id: string; total_paid: number }[] };
  const paidByInvoiceId = new Map((effectiveAmounts ?? []).map((a) => [a.invoice_id, Number(a.total_paid)]));

  const revenueActive = transactionList.filter((t) => t.type === "revenue" && t.status !== "planned");
  const expenseActive = transactionList.filter((t) => t.type === "expense" && t.status !== "planned");

  const budgetTotal = Number(event?.budget_forecast ?? 0);

  const recettesConfirmees = transactionList
    .filter((t) => t.type === "revenue" && t.certainty === "certain")
    .reduce((s, t) => s + Number(t.amount_ttc), 0);
  const recettesPotentielles = transactionList
    .filter((t) => t.type === "revenue" && t.certainty !== "certain")
    .reduce((s, t) => s + Number(t.amount_ttc), 0);

  const depensesEngagees = expenseActive.filter((t) => t.status === "engaged").reduce((s, t) => s + Number(t.amount_ttc), 0);
  const depensesPayees = expenseActive.reduce((s, t) => s + paidAmount(t, paidByInvoiceId), 0);
  const resteAPayer = expenseActive.reduce((s, t) => s + remainingAmount(t, paidByInvoiceId), 0);

  const recettesPayees = revenueActive.reduce((s, t) => s + paidAmount(t, paidByInvoiceId), 0);
  const resteAEncaisser = revenueActive
    .filter((t) => t.certainty === "certain")
    .reduce((s, t) => s + remainingAmount(t, paidByInvoiceId), 0);

  const tresorerieDisponible = recettesPayees - depensesPayees;

  const topLevelCategories = categoryList.filter((c) => c.parent_category_id === null);
  const forecastRevenue = topLevelCategories.filter((c) => c.kind === "revenue").reduce((s, c) => s + Number(c.forecast_amount), 0);
  const forecastExpense = topLevelCategories.filter((c) => c.kind === "expense").reduce((s, c) => s + Number(c.forecast_amount), 0);
  const resultatPrevisionnel = forecastRevenue - forecastExpense;

  // Total real expense committed so far, without double-counting: resteAPayer
  // already nets out whatever's been paid on invoiced/overdue rows, so adding
  // depensesPayees back reconstructs the full committed amount exactly once.
  const resultatReel = recettesConfirmees - (resteAPayer + depensesPayees);

  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Synthèse financière</h1>
          <p className="text-sm text-muted-foreground">Vue d’ensemble consolidée du budget, des recettes et des dépenses.</p>
        </div>
        {canExport ? <AccountingExportButton transactions={transactionList} categoryNameById={categoryNameById} /> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Budget total" value={formatAmount(budgetTotal)} icon={Wallet} />
        <StatCard label="Recettes confirmées" value={formatAmount(recettesConfirmees)} icon={TrendingUp} />
        <StatCard label="Recettes potentielles" value={formatAmount(recettesPotentielles)} icon={TrendingUp} />
        <StatCard label="Dépenses engagées" value={formatAmount(depensesEngagees)} icon={TrendingDown} />
        <StatCard label="Dépenses payées" value={formatAmount(depensesPayees)} icon={TrendingDown} />
        <StatCard
          label="Reste à payer"
          value={formatAmount(resteAPayer)}
          icon={TrendingDown}
          tone={resteAPayer > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Reste à encaisser"
          value={formatAmount(resteAEncaisser)}
          icon={TrendingUp}
          tone={resteAEncaisser > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Trésorerie disponible"
          value={formatAmount(tresorerieDisponible)}
          icon={PiggyBank}
          tone={tresorerieDisponible < 0 ? "danger" : "default"}
        />
        <StatCard
          label="Résultat prévisionnel"
          value={formatAmount(resultatPrevisionnel)}
          icon={Scale}
          tone={resultatPrevisionnel < 0 ? "danger" : "default"}
        />
        <StatCard
          label="Résultat réel"
          value={formatAmount(resultatReel)}
          icon={Landmark}
          tone={resultatReel < 0 ? "danger" : "default"}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        « Trésorerie disponible » ne compte que les mouvements de caisse réels (encaissé − décaissé). « Résultat réel »
        compare les recettes confirmées à l’ensemble des dépenses réellement engagées, quel que soit leur stade de
        paiement — les deux chiffres divergent normalement tant que des factures restent engagées ou facturées sans
        être encore payées.
      </p>

    </div>
  );
}
