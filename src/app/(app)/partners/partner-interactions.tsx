"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { addInteractionAction } from "@/app/(app)/partners/actions";
import { PlusIcon } from "lucide-react";
import type { Tables } from "@/types/database.types";

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  email: "E-mail envoyé",
  call: "Appel effectué",
  meeting: "Rendez-vous",
  linkedin: "Message LinkedIn",
  proposal_sent: "Proposition envoyée",
  convention_sent: "Convention envoyée",
  invoice_sent: "Facture envoyée",
  followup: "Relance",
  note: "Note interne",
  status_change: "Changement de statut",
};

export function PartnerInteractions({
  partnerId,
  interactions,
  canView,
  canEdit,
}: {
  partnerId: string;
  interactions: Tables<"partner_interactions">[];
  canView: boolean;
  canEdit: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    addInteractionAction.bind(null, partnerId),
  );

  if (!canView) {
    return (
      <Card>
        <CardContent className="pt-6">
          <RequestAccessButton resourceType="partners" resourceId={partnerId} permissionRequested="partners.view_history" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Historique des échanges</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon className="size-3.5" /> Ajouter un échange
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un échange</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label>Type d’action</Label>
                  <Select name="type" defaultValue="note">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="summary">Résumé</Label>
                  <Textarea id="summary" name="summary" rows={3} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="next_action">Prochaine action</Label>
                  <Input id="next_action" name="next_action" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="next_followup_date">Prochaine date de relance</Label>
                  <Input id="next_followup_date" name="next_followup_date" type="date" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Ajout…" : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun échange enregistré.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {interactions.map((interaction) => (
              <li key={interaction.id} className="border-l-2 border-muted pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{INTERACTION_TYPE_LABELS[interaction.type] ?? interaction.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interaction.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{interaction.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
