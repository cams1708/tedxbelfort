"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { InvoiceFormDialog } from "@/app/(app)/invoices/invoice-form-dialog";
import { InvoiceDownloadButton } from "@/app/(app)/invoices/invoice-download-button";
import { InvoiceDeleteButton } from "@/app/(app)/invoices/invoice-delete-button";
import { InvoicePaymentsDialog } from "@/app/(app)/invoices/invoice-payments-dialog";
import { INVOICE_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/labels";
import type { Tables, DocumentType } from "@/types/database.types";

const TABS: { value: DocumentType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "quote", label: "Devis" },
  { value: "purchase_order", label: "Bons de commande" },
  { value: "invoice", label: "Factures" },
  { value: "credit_note", label: "Avoirs" },
];

export function InvoicesView({
  invoices,
  categories,
  paymentsByInvoiceId,
  effectiveAmountsByInvoiceId,
  currency,
  canEdit,
  canDelete,
}: {
  invoices: Tables<"invoices">[];
  categories: Tables<"budget_categories">[];
  paymentsByInvoiceId: Map<string, Tables<"invoice_payments">[]>;
  effectiveAmountsByInvoiceId: Map<string, { totalPaid: number; remaining: number }>;
  currency: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [tab, setTab] = useState<string>("all");
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  const filtered = useMemo(
    () => (tab === "all" ? invoices : invoices.filter((i) => i.document_type === tab)),
    [invoices, tab],
  );

  return (
    <Tabs value={tab} onValueChange={(v) => typeof v === "string" && setTab(v)} className="flex flex-col gap-4">
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={tab}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Sens</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Paiements</TableHead>
                <TableHead className="text-right">Justificatif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                    Aucun document pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((invoice) => {
                  const meta = INVOICE_STATUS_LABELS[invoice.status];
                  const effective = effectiveAmountsByInvoiceId.get(invoice.id);
                  const canHavePayments = invoice.document_type === "invoice" || invoice.document_type === "credit_note";
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">{invoice.number}</TableCell>
                      <TableCell className="text-muted-foreground">{DOCUMENT_TYPE_LABELS[invoice.document_type]}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <InvoiceFormDialog
                            invoice={invoice}
                            categories={categories}
                            trigger={
                              <button type="button" className="text-left font-medium hover:underline">
                                {invoice.title}
                              </button>
                            }
                          />
                        ) : (
                          <span className="font-medium">{invoice.title}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.category_id ? (categoryNameById.get(invoice.category_id) ?? "—") : "—"}
                      </TableCell>
                      <TableCell>{invoice.type === "sent_to_partner" ? "Envoyé" : "Reçu"}</TableCell>
                      <TableCell>{formatAmount(Number(invoice.amount))}</TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell className="text-right">
                        {canHavePayments && effective ? (
                          <InvoicePaymentsDialog
                            invoice={invoice}
                            payments={paymentsByInvoiceId.get(invoice.id) ?? []}
                            totalPaid={effective.totalPaid}
                            remaining={effective.remaining}
                            currency={currency}
                            canEdit={canEdit}
                            canDelete={canDelete}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.file_document_id ? <InvoiceDownloadButton documentId={invoice.file_document_id} /> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canDelete ? <InvoiceDeleteButton invoiceId={invoice.id} /> : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
