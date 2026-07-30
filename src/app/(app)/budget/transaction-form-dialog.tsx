"use client";

import { useState } from "react";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { createTransactionAction, updateTransactionAction } from "@/app/(app)/budget/actions";
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
import { TRANSACTION_STATUS_LABELS, CERTAINTY_LABELS } from "@/lib/labels";
import type { Tables, TransactionType } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

export function TransactionFormDialog({
  transaction,
  categories,
  trigger,
}: {
  transaction?: Tables<"financial_transactions">;
  categories: Tables<"budget_categories">[];
  trigger?: React.ReactElement;
}) {
  const action = transaction ? updateTransactionAction.bind(null, transaction.id) : createTransactionAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouveau mouvement
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? "Modifier le mouvement" : "Nouveau mouvement financier"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={transaction?.title} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select name="type" value={type} onValueChange={(v) => typeof v === "string" && setType(v as TransactionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Recette</SelectItem>
                  <SelectItem value="expense">Dépense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Catégorie</Label>
              <Select name="category_id" defaultValue={transaction?.category_id ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount_ht">Montant HT</Label>
              <Input id="amount_ht" name="amount_ht" type="number" step="0.01" defaultValue={transaction?.amount_ht ?? ""} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tva_rate">Taux de TVA (%)</Label>
              <Input id="tva_rate" name="tva_rate" type="number" step="0.01" defaultValue={transaction?.tva_rate ?? 20} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount_ttc">Montant TTC</Label>
              <Input id="amount_ttc" name="amount_ttc" type="number" step="0.01" defaultValue={transaction?.amount_ttc ?? ""} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier_name">Fournisseur / partenaire</Label>
              <Input id="supplier_name" name="supplier_name" defaultValue={transaction?.supplier_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transaction_date">Date</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                defaultValue={transaction?.transaction_date ?? new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="due_date">Échéance</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={transaction?.due_date ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue={transaction?.status ?? "planned"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRANSACTION_STATUS_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === "revenue" ? (
              <div className="flex flex-col gap-2">
                <Label>Certitude de la recette</Label>
                <Select name="certainty" defaultValue={transaction?.certainty ?? "certain"}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CERTAINTY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label>Moyen de paiement</Label>
              <Select name="payment_method" defaultValue={transaction?.payment_method ?? undefined}>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confidential_comment">Commentaire confidentiel</Label>
            <Textarea id="confidential_comment" name="confidential_comment" rows={2} defaultValue={transaction?.confidential_comment ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : transaction ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
