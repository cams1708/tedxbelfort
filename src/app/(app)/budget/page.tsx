import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormDialog } from "@/app/(app)/budget/category-form-dialog";
import { TransactionFormDialog } from "@/app/(app)/budget/transaction-form-dialog";
import { TransactionDeleteButton } from "@/app/(app)/budget/transaction-delete-button";
import { BudgetChart } from "@/app/(app)/budget/budget-chart";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { Can } from "@/lib/permissions/context";
import { TRANSACTION_STATUS_LABELS } from "@/lib/labels";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

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
    supabase.from("events").select("currency, budget_forecast, sponsoring_goal").eq("id", eventId).single(),
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

  const revenue = transactionList.filter((t) => t.type === "revenue").reduce((s, t) => s + Number(t.amount_ttc), 0);
  const expense = transactionList.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount_ttc), 0);

  const categoryTotals = categoryList
    .filter((c) => c.kind === "expense")
    .map((c) => ({
      name: c.name,
      forecast: Number(c.forecast_amount),
      actual: transactionList
        .filter((t) => t.category_id === c.id)
        .reduce((s, t) => s + Number(t.amount_ttc), 0),
    }));

  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name]));
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

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
        <Can module="budget" action="edit">
          <CategoryFormDialog />
        </Can>
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
            {categoryList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                  Aucune catégorie.
                </TableCell>
              </TableRow>
            ) : (
              categoryList.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">
                    {canEdit ? (
                      <CategoryFormDialog
                        category={cat}
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

      <h2 className="text-lg font-semibold">Mouvements financiers</h2>
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
    </div>
  );
}
