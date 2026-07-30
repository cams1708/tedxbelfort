"use client";

import { Button } from "@/components/ui/button";
import { downloadAccountingExport } from "@/lib/export/accounting-export";
import { Download } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function AccountingExportButton({
  transactions,
  categoryNameById,
}: {
  transactions: Tables<"financial_transactions">[];
  categoryNameById: Map<string, string>;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => downloadAccountingExport("export-comptable.csv", transactions, categoryNameById)}
    >
      <Download className="size-3.5" /> Export comptable (CSV)
    </Button>
  );
}
