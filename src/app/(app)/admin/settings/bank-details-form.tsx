"use client";

import { useActionState } from "react";
import { updateBankDetailsAction, type ActionState } from "@/app/(app)/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestAccessButton } from "@/components/shared/request-access-button";

const initialState: ActionState = {};

interface BankDetails {
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
  notes: string | null;
}

export function BankDetailsForm({
  eventId,
  data,
  canView,
  canEdit,
}: {
  eventId: string;
  data: BankDetails | null;
  canView: boolean;
  canEdit: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    (_prev: ActionState, formData: FormData) => updateBankDetailsAction(eventId, formData),
    initialState,
  );

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coordonnées bancaires</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestAccessButton resourceType="budget" permissionRequested="budget.view_bank_details" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Coordonnées bancaires</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <fieldset disabled={!canEdit} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bank_name">Banque</Label>
              <Input id="bank_name" name="bank_name" defaultValue={data?.bank_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bic">BIC</Label>
              <Input id="bic" name="bic" defaultValue={data?.bic ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" name="iban" defaultValue={data?.iban ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={data?.notes ?? ""} />
            </div>
          </fieldset>
          {canEdit ? (
            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
