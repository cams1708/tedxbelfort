import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryFormDialog } from "@/app/(app)/budget/category-form-dialog";
import { TransactionFormDialog } from "@/app/(app)/budget/transaction-form-dialog";
import { TransactionDeleteButton } from "@/app/(app)/budget/transaction-delete-button";
import { BudgetChart } from "@/app/(app)/budget/budget-chart";
import { BudgetComparisonTable } from "@/app/(app)/budget/budget-comparison-table";
import { BudgetCashflowTable } from "@/app/(app)/budget/budget-cashflow-table";
import { BudgetBilanTable } from "@/app/(app)/budget/budget-bilan-table";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { Can } from "@/lib/permissions/context";
import { ExportButton } from "@/components/shared/export-button";
import { TRANSACTION_STATUS_LABELS } from "@/lib/labels";
import { buildBudgetComparison } from "@/lib/finance/comparison";
import { buildCashflowProjection } from "@/lib/finance/cashflow";
import { prepareExportRows, type ExportColumn } from "@/lib/export/csv";
import type { Tables } from "@/types/database.types";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default async function BudgetPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "budget", "view");
  const canEdit = hasAll || can(currentUser.permissions, "budget", "edit");
  const canDelete = hasAll || can(currentUser.permissions, "budget", "delete");
  const canViewBank = hasAll || can(currentUser.permissions, "budget", "view_bank_details");
  const canExport = hasAll || can(currentUser.permissions, "budget", "export");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Budget</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vous n’avez pas accès aux informations financières de cet événement.
        </p>
        <RequestAccessButton resourceType="budget" permissionRequested="budget.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: event }, { data: categories }, { data: transactions }, bankDetails] = await Promise.all([
    supabase.from("events").select("currency, budget_forecast, sponsoring_goal, event_date").eq("id", eventId).single(),
    supabase.from("budget_categories").select("*").eq("event_id", eventId).order("name"),
    supabase
      .from("financial_transactions")
      .select("*")
      .eq("event_id", eventId)
      .order("transaction_date", { ascending: false }),
    canViewBank
      ? supabase.from("event_bank_details").select("*").eq("event_id", eventId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const currency = event?.currency ?? "EUR";
  const categoryList = categories ?? [];
  const transactionList = transactions ?? [];

  const invoiceIds = Array.from(
    new Set(transactionList.map((t) => t.invoice_id).filter((id): id is string => !!id)),
  );
  const { data: effectiveAmounts } =
    invoiceIds.length > 0
      ? await supabase.from("invoice_effective_amounts").select("invoice_id, total_paid").in("invoice_id", invoiceIds)
      : { data: [] as { invoice_id: string; total_paid: number }[] };
  const paidAmountByInvoiceId = new Map((effectiveAmounts ?? []).map((a) => [a.invoice_id, Number(a.total_paid)]));

  const revenue = transactionList.filter((t) => t.type === "revenue").reduce((s, t) => s + Number(t.amount_ttc), 0);
  const expense = transactionList.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount_ttc), 0);

  const categoryTotals = categoryList
    .filter((c) => c.kind === "expense" && c.parent_category_id === null)
    .map((c) => {
      const childIds = categoryList.filter((child) => child.parent_category_id === c.id).map((child) => child.id);
      return {
        name: c.name,
        forecast: Number(c.forecast_amount),
        actual: transactionList
          .filter((t) => t.category_id === c.id || (t.category_id && childIds.includes(t.category_id)))
          .reduce((s, t) => s + Number(t.amount_ttc), 0),
      };
    });

  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name]));
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  // Top-level categories first, each immediately followed by its own
  // sub-categories, so the hierarchy reads naturally in the table.
  const sortedCategoryRows: Tables<"budget_categories">[] = [];
  for (const cat of categoryList.filter((c) => c.parent_category_id === null)) {
    sortedCategoryRows.push(cat);
    for (const child of categoryList.filter((c) => c.parent_category_id === cat.id)) {
      sortedCategoryRows.push(child);
    }
  }

  const overspentCategories = categoryList
    .filter((c) => c.kind === "expense")
    .filter((c) => {
      const childIds = categoryList.filter((child) => child.parent_category_id === c.id).map((child) => child.id);
      const spent = transactionList
        .filter((t) => t.status !== "cancelled" && (t.category_id === c.id || (t.category_id && childIds.includes(t.category_id))))
        .reduce((s, t) => s + Number(t.amount_ttc), 0);
      return spent > Number(c.forecast_amount);
    });

  const comparisonRows = buildBudgetComparison(categoryList, transactionList, paidAmountByInvoiceId);
  const cashflowRows = buildCashflowProjection(transactionList, categoryList, event?.event_date ?? null);

  const transactionColumns: ExportColumn<Tables<"financial_transactions">>[] = [
    { label: "Titre", value: (t) => t.title },
    { label: "Catégorie", value: (t) => (t.category_id ? (categoryNameById.get(t.category_id) ?? "—") : "—") },
    { label: "Type", value: (t) => (t.type === "revenue" ? "Recette" : "Dépense") },
    { label: "Montant TTC", value: (t) => Number(t.amount_ttc) },
    { label: "Statut", value: (t) => TRANSACTION_STATUS_LABELS[t.status]?.label ?? t.status },
    { label: "Date", value: (t) => t.transaction_date },
  ];

  const categoryColumns: ExportColumn<Tables<"budget_categories">>[] = [
    { label: "Nom", value: (c) => c.name },
    { label: "Type", value: (c) => (c.kind === "revenue" ? "Recette" : "Dépense") },
    { label: "Prévisionnel", value: (c) => Number(c.forecast_amount) },
  ];
  const transactionExport = prepareExportRows(transactionList, transactionColumns);
  const categoryExport = prepareExportRows(categoryList, categoryColumns);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget</h1>
          <p className="text-sm text-muted-foreground">Recettes, dépenses et suivi prévisionnel.</p>
        </div>
        <Can module="budget" action="create">
          <TransactionFormDialog categories={categoryList} />
        </Can>
      </div>

      {overspentCategories.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Dépassement de budget</AlertTitle>
          <AlertDescription>
            {overspentCategories.map((c) => c.name).join(", ")} — dépenses au-delà du prévisionnel.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
          <TabsTrigger value="cashflow">Trésorerie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Recettes" value={formatAmount(revenue)} icon={TrendingUp} />
            <StatCard label="Dépenses" value={formatAmount(expense)} icon={TrendingDown} />
            <StatCard
              label="Reste disponible"
              value={formatAmount(revenue - expense)}
              icon={Wallet}
              tone={revenue - expense < 0 ? "danger" : "default"}
            />
          </div>

          {categoryTotals.length > 0 ? <BudgetChart data={categoryTotals} currency={currency} /> : null}

          {canViewBank ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coordonnées bancaires</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banque</span>
                  <span>{bankDetails.data?.bank_name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN</span>
                  <span>{bankDetails.data?.iban ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BIC</span>
                  <span>{bankDetails.data?.bic ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RequestAccessButton resourceType="budget" permissionRequested="budget.view_bank_details" />
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Catégories</h2>
            <div className="flex items-center gap-2">
              {canExport ? (
                <ExportButton
                  filename="categories-budget"
                  sheetName="Catégories"
                  headers={categoryExport.headers}
                  data={categoryExport.data}
                />
              ) : null}
              <Can module="budget" action="edit">
                <CategoryFormDialog categories={categoryList} />
              </Can>
            </div>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prévisionnel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategoryRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                      Aucune catégorie.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCategoryRows.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className={cat.parent_category_id ? "pl-8 font-medium" : "font-medium"}>
                        {canEdit ? (
                          <CategoryFormDialog
                            category={cat}
                            categories={categoryList}
                            trigger={
                              <button type="button" className="text-left font-medium hover:underline">
                                {cat.name}
                              </button>
                            }
                          />
                        ) : (
                          cat.name
                        )}
                      </TableCell>
                      <TableCell>{cat.kind === "revenue" ? "Recette" : "Dépense"}</TableCell>
                      <TableCell>{formatAmount(Number(cat.forecast_amount))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mouvements financiers</h2>
            {canExport ? (
              <ExportButton
                filename="mouvements-financiers"
                sheetName="Mouvements"
                headers={transactionExport.headers}
                data={transactionExport.data}
              />
            ) : null}
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionList.map((t) => {
                    const meta = TRANSACTION_STATUS_LABELS[t.status];
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          {canEdit ? (
                            <TransactionFormDialog
                              transaction={t}
                              categories={categoryList}
                              trigger={
                                <button type="button" className="text-left font-medium hover:underline">
                                  {t.title}
                                </button>
                              }
                            />
                          ) : (
                            <span className="font-medium">{t.title}</span>
                          )}
                        </TableCell>
                        <TableCell>{t.category_id ? (categoryNameById.get(t.category_id) ?? "—") : "—"}</TableCell>
                        <TableCell>{t.type === "revenue" ? "Recette" : "Dépense"}</TableCell>
                        <TableCell>{formatAmount(Number(t.amount_ttc))}</TableCell>
                        <TableCell>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </TableCell>
                        <TableCell>{new Date(t.transaction_date).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>
                          {t.invoice_id ? (
                            <span className="text-xs text-muted-foreground">Facture (auto)</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Manuel</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canDelete ? <TransactionDeleteButton transactionId={t.id} /> : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="bilan" className="flex flex-col gap-4">
          <BudgetBilanTable rows={comparisonRows} currency={currency} />
        </TabsContent>

        <TabsContent value="comparison" className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Prévisionnel, engagé, facturé et payé par catégorie, avec l’écart en euros et en pourcentage.
          </p>
          <BudgetComparisonTable rows={comparisonRows} currency={currency} />
        </TabsContent>

        <TabsContent value="cashflow" className="flex flex-col gap-4">
          <BudgetCashflowTable rows={cashflowRows} currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
