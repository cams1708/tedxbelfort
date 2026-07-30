"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createBudgetCategoryAction, updateBudgetCategoryAction } from "@/app/(app)/budget/actions";
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
import type { Tables } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

export function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: Tables<"budget_categories">;
  trigger?: React.ReactElement;
}) {
  const action = category ? updateBudgetCategoryAction.bind(null, category.id) : createBudgetCategoryAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              <PlusIcon className="size-3.5" /> Nouvelle catégorie
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie budgétaire"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={category?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select name="kind" defaultValue={category?.kind ?? "expense"}>
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
            <Label htmlFor="forecast_amount">Montant prévisionnel</Label>
            <Input
              id="forecast_amount"
              name="forecast_amount"
              type="number"
              step="0.01"
              defaultValue={category?.forecast_amount ?? 0}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : category ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
