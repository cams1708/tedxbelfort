"use client";

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
import { INVOICE_STATUS_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouvelle facture
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Modifier la facture" : "Nouvelle facture"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="number">Numéro</Label>
              <Input id="number" name="number" defaultValue={invoice?.number} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select name="type" defaultValue={invoice?.type ?? "received_from_supplier"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent_to_partner">Envoyée à un partenaire</SelectItem>
                  <SelectItem value="received_from_supplier">Reçue d’un prestataire</SelectItem>
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
              <Select name="status" defaultValue={invoice?.status ?? "draft"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVOICE_STATUS_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
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
            Passer le statut à « Payée » ajoute (ou met à jour) automatiquement le mouvement correspondant dans le
            budget réel, dans la catégorie choisie ci-dessus.
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
