"use client";

import { useState } from "react";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { createInvoiceAction, updateInvoiceAction } from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { INVOICE_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/labels";
import type { Tables, DocumentType } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

// "Payée" / "Partiellement payée" are now derived automatically from
// recorded payments (see invoice-payments-dialog) — not a manual choice.
const MANUAL_STATUS_VALUES = ["draft", "to_send", "sent", "pending", "overdue", "cancelled"] as const;

export function InvoiceFormDialog({
  invoice,
  categories,
  trigger,
}: {
  invoice?: Tables<"invoices">;
  categories: Tables<"budget_categories">[];
  trigger?: React.ReactElement;
}) {
  const action = invoice ? updateInvoiceAction.bind(null, invoice.id) : createInvoiceAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);
  const [documentType, setDocumentType] = useState<DocumentType>(invoice?.document_type ?? "invoice");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouveau document
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? `Modifier — ${DOCUMENT_TYPE_LABELS[invoice.document_type]}` : "Nouveau document financier"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Type de document</Label>
              <Select
                name="document_type"
                value={documentType}
                onValueChange={(v) => typeof v === "string" && setDocumentType(v as DocumentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="number">Numéro</Label>
              <Input id="number" value={invoice?.number ?? "Généré à la création"} disabled />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Sens</Label>
              <Select name="type" defaultValue={invoice?.type ?? "received_from_supplier"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent_to_partner">Envoyé à un partenaire</SelectItem>
                  <SelectItem value="received_from_supplier">Reçu d’un prestataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" defaultValue={invoice?.title} required />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier_name">Fournisseur / partenaire</Label>
              <Input id="supplier_name" name="supplier_name" defaultValue={invoice?.supplier_name ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Catégorie budgétaire</Label>
              <Select name="category_id" defaultValue={invoice?.category_id ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind === "revenue" ? "recette" : "dépense"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={invoice?.amount ?? ""} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tva">TVA</Label>
              <Input id="tva" name="tva" type="number" step="0.01" defaultValue={invoice?.tva ?? 0} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="issue_date">Date d’émission</Label>
              <Input
                id="issue_date"
                name="issue_date"
                type="date"
                defaultValue={invoice?.issue_date ?? new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="due_date">Date d’échéance</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={invoice?.due_date ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue={invoice && invoice.status in INVOICE_STATUS_LABELS ? invoice.status : "draft"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {INVOICE_STATUS_LABELS[value].label}
                    </SelectItem>
                  ))}
                  {invoice && (invoice.status === "paid" || invoice.status === "partially_paid") ? (
                    <SelectItem value={invoice.status} disabled>
                      {INVOICE_STATUS_LABELS[invoice.status].label} (via paiements enregistrés)
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Justificatif (PDF ou image)</Label>
            <Input id="file" name="file" type="file" accept="application/pdf,image/*" />
            {invoice?.file_document_id ? (
              <p className="text-xs text-muted-foreground">
                Un fichier est déjà joint. En sélectionner un nouveau le remplacera.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confidential_notes">Notes confidentielles</Label>
            <Textarea id="confidential_notes" name="confidential_notes" rows={2} defaultValue={invoice?.confidential_notes ?? ""} />
          </div>
          <p className="text-xs text-muted-foreground">
            {documentType === "quote" || documentType === "purchase_order"
              ? "Les devis et bons de commande n'alimentent pas le budget réel — ils restent purement informatifs tant qu'aucune facture réelle n'est créée."
              : documentType === "credit_note"
                ? "Un avoir vient réduire automatiquement le montant de sa catégorie dans le budget réel."
                : "Dès qu'elle quitte le statut brouillon, la facture alimente automatiquement le budget réel. Le statut « Payée »/« Partiellement payée » se met à jour tout seul dès qu'un paiement est enregistré."}
          </p>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : invoice ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
