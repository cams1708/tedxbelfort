"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createPartnerAction, updatePartnerAction } from "@/app/(app)/partners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PARTNER_STATUS_LABELS, PARTNER_PRIORITY_LABELS, CONTRIBUTION_TYPE_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";
import type { TeamMemberOption } from "@/app/(app)/partners/types";
import { PlusIcon } from "lucide-react";

export function PartnerFormDialog({
  partner,
  trigger,
  teamMembers = [],
}: {
  partner?: Tables<"partners">;
  trigger?: React.ReactElement;
  teamMembers?: TeamMemberOption[];
}) {
  const action = partner ? updatePartnerAction.bind(null, partner.id) : createPartnerAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouveau partenaire
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? "Modifier le partenaire" : "Nouveau partenaire"}</DialogTitle>
          <DialogDescription>Informations générales de prospection.</DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="company_name">Nom de l’entreprise</Label>
              <Input id="company_name" name="company_name" defaultValue={partner?.company_name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sector">Secteur d’activité</Label>
              <Input id="sector" name="sector" defaultValue={partner?.sector ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="website">Site internet</Label>
              <Input id="website" name="website" defaultValue={partner?.website ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" defaultValue={partner?.address ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_name">Nom du contact</Label>
              <Input id="contact_name" name="contact_name" defaultValue={partner?.contact_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_role">Fonction du contact</Label>
              <Input id="contact_role" name="contact_role" defaultValue={partner?.contact_role ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_email">E-mail du contact</Label>
              <Input id="contact_email" name="contact_email" type="email" defaultValue={partner?.contact_email ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_phone">Téléphone du contact</Label>
              <Input id="contact_phone" name="contact_phone" defaultValue={partner?.contact_phone ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source du contact</Label>
              <Input id="source" name="source" defaultValue={partner?.source ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Responsable</Label>
              <Select name="assigned_team_member_id" defaultValue={partner?.assigned_team_member_id ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Non attribué" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type de contribution</Label>
              <Select name="contribution_type" defaultValue={partner?.contribution_type ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRIBUTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priorité</Label>
              <Select name="priority" defaultValue={partner?.priority ?? "medium"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_PRIORITY_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue={partner?.status ?? "to_research"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_STATUS_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="next_followup_date">Prochaine date de relance</Label>
              <Input
                id="next_followup_date"
                name="next_followup_date"
                type="date"
                defaultValue={partner?.next_followup_date ?? ""}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="next_action">Prochaine action</Label>
              <Input id="next_action" name="next_action" defaultValue={partner?.next_action ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input id="tags" name="tags" defaultValue={partner?.tags?.join(", ") ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={partner?.notes ?? ""} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : partner ? "Enregistrer" : "Créer le partenaire"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
