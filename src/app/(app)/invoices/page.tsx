import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { Can } from "@/lib/permissions/context";
import { ExportButton } from "@/components/shared/export-button";
import { InvoiceFormDialog } from "@/app/(app)/invoices/invoice-form-dialog";
import { InvoicesView } from "@/app/(app)/invoices/invoices-view";
import { INVOICE_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/labels";
import type { ExportColumn } from "@/lib/export/csv";
import type { Tables } from "@/types/database.types";

export default async function InvoicesPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "invoices", "view");
  const canEdit = hasAll || can(currentUser.permissions, "invoices", "edit");
  const canDelete = hasAll || can(currentUser.permissions, "invoices", "delete");
  const canExport = hasAll || can(currentUser.permissions, "invoices", "export");

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
  const currency = event?.currency ?? "EUR";

  const invoiceIds = invoiceList
    .filter((i) => i.document_type === "invoice" || i.document_type === "credit_note")
    .map((i) => i.id);

  const [{ data: payments }, { data: effectiveAmounts }] =
    invoiceIds.length > 0
      ? await Promise.all([
          supabase.from("invoice_payments").select("*").in("invoice_id", invoiceIds).order("payment_date", { ascending: false }),
          supabase.from("invoice_effective_amounts").select("*").in("invoice_id", invoiceIds),
        ])
      : [{ data: [] as Tables<"invoice_payments">[] }, { data: [] as Tables<"invoice_effective_amounts">[] }];

  const paymentsByInvoiceId = new Map<string, Tables<"invoice_payments">[]>();
  for (const p of payments ?? []) {
    paymentsByInvoiceId.set(p.invoice_id, [...(paymentsByInvoiceId.get(p.invoice_id) ?? []), p]);
  }
  const effectiveAmountsByInvoiceId = new Map(
    (effectiveAmounts ?? []).map((a) => [a.invoice_id, { totalPaid: Number(a.total_paid), remaining: Number(a.remaining) }]),
  );

  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name]));
  const exportColumns: ExportColumn<Tables<"invoices">>[] = [
    { label: "Numéro", value: (i) => i.number },
    { label: "Type", value: (i) => DOCUMENT_TYPE_LABELS[i.document_type] },
    { label: "Titre", value: (i) => i.title },
    { label: "Catégorie", value: (i) => (i.category_id ? (categoryNameById.get(i.category_id) ?? "—") : "—") },
    { label: "Sens", value: (i) => (i.type === "sent_to_partner" ? "Envoyé" : "Reçu") },
    { label: "Montant HT", value: (i) => Number(i.amount) },
    { label: "TVA", value: (i) => Number(i.tva) },
    { label: "Statut", value: (i) => INVOICE_STATUS_LABELS[i.status]?.label ?? i.status },
    { label: "Échéance", value: (i) => i.due_date ?? "" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Devis, bons de commande, factures et avoirs — envoyés aux partenaires ou reçus des prestataires.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport ? (
            <ExportButton filename="factures" sheetName="Factures" rows={invoiceList} columns={exportColumns} />
          ) : null}
          <Can module="invoices" action="create">
            <InvoiceFormDialog categories={categoryList} />
          </Can>
        </div>
      </div>

      <InvoicesView
        invoices={invoiceList}
        categories={categoryList}
        paymentsByInvoiceId={paymentsByInvoiceId}
        effectiveAmountsByInvoiceId={effectiveAmountsByInvoiceId}
        currency={currency}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
