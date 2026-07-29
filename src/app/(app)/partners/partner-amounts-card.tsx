"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { updatePartnerAmountsAction } from "@/app/(app)/partners/actions";
import { Pencil } from "lucide-react";

interface Amounts {
  amount_expected: number | null;
  amount_proposed: number | null;
  amount_confirmed: number | null;
}

export function PartnerAmountsCard({
  partnerId,
  amounts,
  canView,
  canEdit,
  currency,
}: {
  partnerId: string;
  amounts: Amounts | null;
  canView: boolean;
  canEdit: boolean;
  currency: string;
}) {
  const formatAmount = (value: number | null) =>
    value === null || value === undefined ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    updatePartnerAmountsAction.bind(null, partnerId),
  );

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Montants</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestAccessButton resourceType="partners" resourceId={partnerId} permissionRequested="partners.view_amounts" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Montants</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Pencil className="size-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier les montants</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount_expected">Montant espéré</Label>
                  <Input
                    id="amount_expected"
                    name="amount_expected"
                    type="number"
                    step="0.01"
                    defaultValue={amounts?.amount_expected ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount_proposed">Montant proposé</Label>
                  <Input
                    id="amount_proposed"
                    name="amount_proposed"
                    type="number"
                    step="0.01"
                    defaultValue={amounts?.amount_proposed ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount_confirmed">Montant confirmé</Label>
                  <Input
                    id="amount_confirmed"
                    name="amount_confirmed"
                    type="number"
                    step="0.01"
                    defaultValue={amounts?.amount_confirmed ?? ""}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Espéré</span>
          <span className="font-medium">{formatAmount(amounts?.amount_expected ?? null)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Proposé</span>
          <span className="font-medium">{formatAmount(amounts?.amount_proposed ?? null)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confirmé</span>
          <span className="font-medium">{formatAmount(amounts?.amount_confirmed ?? null)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
