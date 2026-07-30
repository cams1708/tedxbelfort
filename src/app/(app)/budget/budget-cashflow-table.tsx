import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashflowMonthRow } from "@/lib/finance/cashflow";

export function BudgetCashflowTable({ rows, currency }: { rows: CashflowMonthRow[]; currency: string }) {
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Solde cumulé mois par mois jusqu’au jour de l’événement. La dernière ligne inclut l’écart budgétaire résiduel
        (prévisionnel non encore engagé), projeté en une seule fois faute de granularité mensuelle plus fine.
      </p>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Mouvements réels</TableHead>
              <TableHead>Ajustement prévisionnel</TableHead>
              <TableHead>Solde cumulé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Aucune donnée.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.monthKey}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell>{formatAmount(r.netMovements)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.forecastAdjustment !== 0 ? formatAmount(r.forecastAdjustment) : "—"}
                  </TableCell>
                  <TableCell className={r.cumulativeBalance < 0 ? "font-medium text-destructive" : "font-medium"}>
                    {formatAmount(r.cumulativeBalance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
