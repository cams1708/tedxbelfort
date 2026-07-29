"use client";

import { useTransition } from "react";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { createFollowupAction, completeFollowupAction } from "@/app/(app)/partners/actions";
import { FOLLOWUP_STATUS_LABELS } from "@/lib/labels";
import { PlusIcon, CheckIcon } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function PartnerFollowups({
  partnerId,
  followups,
  canView,
  canEdit,
}: {
  partnerId: string;
  followups: Tables<"partner_followups">[];
  canView: boolean;
  canEdit: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    createFollowupAction.bind(null, partnerId),
  );
  const [, startTransition] = useTransition();

  if (!canView) {
    return (
      <Card>
        <CardContent className="pt-6">
          <RequestAccessButton resourceType="followups" resourceId={partnerId} permissionRequested="followups.view" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Relances</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon className="size-3.5" /> Nouvelle relance
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer une relance</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="due_date">Date de relance</Label>
                  <Input id="due_date" name="due_date" type="date" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea id="note" name="note" rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Création…" : "Créer la relance"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {followups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune relance programmée.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {followups.map((followup) => {
              const meta = FOLLOWUP_STATUS_LABELS[followup.status];
              return (
                <li key={followup.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium">{format(new Date(followup.due_date), "d MMMM yyyy", { locale: fr })}</div>
                    {followup.note ? <p className="text-muted-foreground">{followup.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={meta.label} tone={meta.tone} />
                    {canEdit && followup.status !== "done" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          startTransition(() => {
                            void completeFollowupAction(followup.id);
                          })
                        }
                      >
                        <CheckIcon className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
