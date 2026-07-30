"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createSubsidyAction, updateSubsidyAction } from "@/app/(app)/subsidies/actions";
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
import { SUBSIDY_STATUS_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

export function SubsidyFormDialog({
  subsidy,
  trigger,
}: {
  subsidy?: Tables<"subsidies">;
  trigger?: React.ReactElement;
}) {
  const action = subsidy ? updateSubsidyAction.bind(null, subsidy.id) : createSubsidyAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouvelle subvention
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subsidy ? "Modifier la subvention" : "Nouvelle subvention"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom de la subvention</Label>
            <Input id="name" name="name" defaultValue={subsidy?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grantor">Organisme</Label>
            <Input id="grantor" name="grantor" defaultValue={subsidy?.grantor ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount_requested">Demandé</Label>
              <Input
                id="amount_requested"
                name="amount_requested"
                type="number"
                step="0.01"
                defaultValue={subsidy?.amount_requested ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount_granted">Accordé</Label>
              <Input
                id="amount_granted"
                name="amount_granted"
                type="number"
                step="0.01"
                defaultValue={subsidy?.amount_granted ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount_received">Versé</Label>
              <Input
                id="amount_received"
                name="amount_received"
                type="number"
                step="0.01"
                defaultValue={subsidy?.amount_received ?? 0}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Statut</Label>
            <Select name="status" defaultValue={subsidy?.status ?? "requested"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSIDY_STATUS_LABELS).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={subsidy?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : subsidy ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
