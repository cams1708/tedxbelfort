import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoryComparisonRow } from "@/lib/finance/comparison";

export function BudgetComparisonTable({ rows, currency }: { rows: CategoryComparisonRow[]; currency: string }) {
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Catégorie</TableHead>
            <TableHead>Prévisionnel</TableHead>
            <TableHead>Engagé</TableHead>
            <TableHead>Facturé</TableHead>
            <TableHead>Payé</TableHead>
            <TableHead>Écart</TableHead>
            <TableHead>Écart %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucune catégorie.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className={r.isSubCategory ? "pl-8 text-muted-foreground" : "font-medium"}>
                  {r.name}
                </TableCell>
                <TableCell>{formatAmount(r.forecast)}</TableCell>
                <TableCell>{formatAmount(r.engaged)}</TableCell>
                <TableCell>{formatAmount(r.invoiced)}</TableCell>
                <TableCell>{formatAmount(r.paid)}</TableCell>
                <TableCell className={r.gapAmount > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {r.gapAmount > 0 ? "+" : ""}
                  {formatAmount(r.gapAmount)}
                </TableCell>
                <TableCell className={r.gapAmount > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {r.gapPercent === null ? "—" : `${r.gapPercent > 0 ? "+" : ""}${r.gapPercent.toFixed(1)}%`}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
