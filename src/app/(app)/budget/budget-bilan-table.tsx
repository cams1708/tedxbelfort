import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoryComparisonRow } from "@/lib/finance/comparison";

function Side({
  title,
  rows,
  formatAmount,
}: {
  title: string;
  rows: CategoryComparisonRow[];
  formatAmount: (value: number) => string;
}) {
  // Sub-category amounts are already rolled into their parent's own
  // forecast/engaged/invoiced/paid figures (buildBudgetComparison does the
  // rollup) — summing every row here would double-count them.
  const topLevelRows = rows.filter((r) => !r.isSubCategory);
  const total = topLevelRows.reduce((s, r) => s + r.forecast, 0);
  const totalReal = topLevelRows.reduce((s, r) => s + r.engaged + r.invoiced + r.paid, 0);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prévisionnel</TableHead>
              <TableHead>Réel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                  Aucune catégorie.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className={r.isSubCategory ? "pl-8 text-muted-foreground" : "font-medium"}>{r.name}</TableCell>
                  <TableCell>{formatAmount(r.forecast)}</TableCell>
                  <TableCell>{formatAmount(r.engaged + r.invoiced + r.paid)}</TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="font-semibold">{formatAmount(total)}</TableCell>
              <TableCell className="font-semibold">{formatAmount(totalReal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function BudgetBilanTable({ rows, currency }: { rows: CategoryComparisonRow[]; currency: string }) {
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
  const revenueRows = rows.filter((r) => r.kind === "revenue");
  const expenseRows = rows.filter((r) => r.kind === "expense");

  const totalRevenueForecast = revenueRows.filter((r) => !r.isSubCategory).reduce((s, r) => s + r.forecast, 0);
  const totalExpenseForecast = expenseRows.filter((r) => !r.isSubCategory).reduce((s, r) => s + r.forecast, 0);
  const totalRevenueReal = revenueRows
    .filter((r) => !r.isSubCategory)
    .reduce((s, r) => s + r.engaged + r.invoiced + r.paid, 0);
  const totalExpenseReal = expenseRows
    .filter((r) => !r.isSubCategory)
    .reduce((s, r) => s + r.engaged + r.invoiced + r.paid, 0);

  const resultatPrevisionnel = totalRevenueForecast - totalExpenseForecast;
  const resultatReel = totalRevenueReal - totalExpenseReal;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Se remplit automatiquement à partir des catégories et des mouvements enregistrés. « Réel » couvre tout ce qui
        est engagé, facturé ou payé à ce jour — pas seulement l’encaissé/décaissé.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Side title="Recettes" rows={revenueRows} formatAmount={formatAmount} />
        <Side title="Dépenses" rows={expenseRows} formatAmount={formatAmount} />
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Résultat prévisionnel</span>
          <span className={"text-xl font-semibold " + (resultatPrevisionnel < 0 ? "text-destructive" : "")}>
            {formatAmount(resultatPrevisionnel)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Résultat réel</span>
          <span className={"text-xl font-semibold " + (resultatReel < 0 ? "text-destructive" : "")}>
            {formatAmount(resultatReel)}
          </span>
        </div>
      </div>
    </div>
  );
}
