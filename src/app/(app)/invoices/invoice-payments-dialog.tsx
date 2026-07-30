"use client";

import { useTransition } from "react";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { createInvoicePaymentAction, deleteInvoicePaymentAction } from "@/app/(app)/invoices/payments-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, Wallet } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function InvoicePaymentsDialog({
  invoice,
  payments,
  totalPaid,
  remaining,
  currency,
  canEdit,
  canDelete,
}: {
  invoice: Tables<"invoices">;
  payments: Tables<"invoice_payments">[];
  totalPaid: number;
  remaining: number;
  currency: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    createInvoicePaymentAction.bind(null, invoice.id),
  );
  const [isDeleting, startDelete] = useTransition();
  const formatAmount = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Wallet className="size-3.5" /> {formatAmount(totalPaid)} / {formatAmount(invoice.amount + invoice.tva)}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiements — {invoice.number}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant dû</span>
            <span>{formatAmount(invoice.amount + invoice.tva)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Déjà payé</span>
            <span>{formatAmount(totalPaid)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Restant</span>
            <span>{formatAmount(remaining)}</span>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{formatAmount(p.amount)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString("fr-FR")}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                </div>
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isDeleting}
                    onClick={() => startDelete(() => void deleteInvoicePaymentAction(p.id))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
        )}

        {canEdit && remaining > 0 ? (
          <form action={handleAction} className="flex flex-col gap-3 border-t pt-3">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Montant</Label>
                <Input id="amount" name="amount" type="number" step="0.01" max={remaining} defaultValue={remaining} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment_date">Date</Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label>Moyen de paiement</Label>
                <Select name="payment_method">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="reference">Référence</Label>
                <Input id="reference" name="reference" placeholder="N° de chèque, référence de virement…" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement…" : "Ajouter le paiement"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
