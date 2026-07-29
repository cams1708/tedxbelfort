import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { Can } from "@/lib/permissions/context";
import { InvoiceFormDialog } from "@/app/(app)/invoices/invoice-form-dialog";
import { InvoiceDownloadButton } from "@/app/(app)/invoices/invoice-download-button";
import { InvoiceDeleteButton } from "@/app/(app)/invoices/invoice-delete-button";
import { INVOICE_STATUS_LABELS } from "@/lib/labels";

export default async function InvoicesPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "invoices", "view");
  const canEdit = hasAll || can(currentUser.permissions, "invoices", "edit");
  const canDelete = hasAll || can(currentUser.permissions, "invoices", "delete");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Factures</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Vous n’avez pas accès aux factures de cet événement.</p>
        <RequestAccessButton resourceType="invoices" permissionRequested="invoices.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: event }, { data: invoices }, { data: categories }] = await Promise.all([
    supabase.from("events").select("currency").eq("id", eventId).single(),
    supabase.from("invoices").select("*").eq("event_id", eventId).order("issue_date", { ascending: false }),
    supabase.from("budget_categories").select("*").eq("event_id", eventId).order("name"),
  ]);

  const invoiceList = invoices ?? [];
  const categoryList = categories ?? [];
  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name]));
  const currency = event?.currency ?? "EUR";
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Factures envoyées et reçues. Une facture marquée « Payée » alimente automatiquement le budget réel.
          </p>
        </div>
        <Can module="invoices" action="create">
          <InvoiceFormDialog categories={categoryList} />
        </Can>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Justificatif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Aucune facture pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              invoiceList.map((invoice) => {
                const meta = INVOICE_STATUS_LABELS[invoice.status];
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.number}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <InvoiceFormDialog
                          invoice={invoice}
                          categories={categoryList}
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
                    <TableCell>{invoice.type === "sent_to_partner" ? "Envoyée" : "Reçue"}</TableCell>
                    <TableCell>{formatAmount(Number(invoice.amount))}</TableCell>
                    <TableCell>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </TableCell>
                    <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
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
    </div>
  );
}
