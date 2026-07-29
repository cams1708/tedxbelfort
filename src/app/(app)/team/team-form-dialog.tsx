"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createTeamMemberAction, updateTeamMemberAction } from "@/app/(app)/team/actions";
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
import { TEAM_POLE_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

export function TeamFormDialog({
  member,
  accounts,
  trigger,
}: {
  member?: Tables<"team_members">;
  accounts: { id: string; full_name: string }[];
  trigger?: React.ReactElement;
}) {
  const action = member ? updateTeamMemberAction.bind(null, member.id) : createTeamMemberAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouveau membre
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Modifier le membre" : "Nouveau membre"}</DialogTitle>
          <DialogDescription>Informations générales de l’équipe.</DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input id="first_name" name="first_name" defaultValue={member?.first_name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" name="last_name" defaultValue={member?.last_name} required />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="role_label">Rôle / fonction</Label>
              <Input id="role_label" name="role_label" defaultValue={member?.role_label ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Pôle</Label>
              <Select name="pole" defaultValue={member?.pole ?? "volunteers"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_POLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="arrival_date">Date d’arrivée</Label>
              <Input id="arrival_date" name="arrival_date" type="date" defaultValue={member?.arrival_date ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="availability">Disponibilités</Label>
              <Input id="availability" name="availability" defaultValue={member?.availability ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="workload_notes">Charge de travail / notes</Label>
              <Textarea id="workload_notes" name="workload_notes" rows={3} defaultValue={member?.workload_notes ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Compte utilisateur lié</Label>
              <Select name="profile_id" defaultValue={member?.profile_id ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucun (bénévole sans compte)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Relier un compte permet à la personne de compléter elle-même ses coordonnées.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : member ? "Enregistrer" : "Ajouter le membre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
