"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { updatePartnerConfidentialNotesAction } from "@/app/(app)/partners/actions";
import { Pencil } from "lucide-react";

export function PartnerConfidentialNotesCard({
  partnerId,
  notes,
  canView,
  canEdit,
}: {
  partnerId: string;
  notes: string | null;
  canView: boolean;
  canEdit: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    updatePartnerConfidentialNotesAction.bind(null, partnerId),
  );

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes confidentielles</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestAccessButton
            resourceType="partners"
            resourceId={partnerId}
            permissionRequested="partners.view_confidential_notes"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Notes confidentielles</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Pencil className="size-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier les notes confidentielles</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Textarea name="notes" rows={5} defaultValue={notes ?? ""} />
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
      <CardContent>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{notes || "Aucune note."}</p>
      </CardContent>
    </Card>
  );
}
