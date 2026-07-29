"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createSpeakerAction, updateSpeakerAction } from "@/app/(app)/speakers/actions";
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
import { SPEAKER_STATUS_LABELS } from "@/lib/labels";
import type { Tables } from "@/types/database.types";
import { PlusIcon } from "lucide-react";

export function SpeakerFormDialog({ speaker, trigger }: { speaker?: Tables<"speakers">; trigger?: React.ReactElement }) {
  const action = speaker ? updateSpeakerAction.bind(null, speaker.id) : createSpeakerAction;
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(action);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon /> Nouveau speaker
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{speaker ? "Modifier le speaker" : "Nouveau speaker"}</DialogTitle>
          <DialogDescription>Profil, sujet et suivi de la préparation.</DialogDescription>
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
              <Input id="first_name" name="first_name" defaultValue={speaker?.first_name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" name="last_name" defaultValue={speaker?.last_name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" defaultValue={speaker?.city ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profession">Profession</Label>
              <Input id="profession" name="profession" defaultValue={speaker?.profession ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="company">Entreprise / organisation</Label>
              <Input id="company" name="company" defaultValue={speaker?.company ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea id="bio" name="bio" rows={3} defaultValue={speaker?.bio ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="proposed_topic">Sujet proposé</Label>
              <Input id="proposed_topic" name="proposed_topic" defaultValue={speaker?.proposed_topic ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="talk_title">Titre provisoire du talk</Label>
              <Input id="talk_title" name="talk_title" defaultValue={speaker?.talk_title ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="talk_summary">Résumé</Label>
              <Textarea id="talk_summary" name="talk_summary" rows={3} defaultValue={speaker?.talk_summary ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="talk_angle">Angle du talk</Label>
              <Input id="talk_angle" name="talk_angle" defaultValue={speaker?.talk_angle ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration_minutes">Durée prévue (minutes)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                defaultValue={speaker?.duration_minutes ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue={speaker?.status ?? "considered"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SPEAKER_STATUS_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="availability">Disponibilités</Label>
              <Input id="availability" name="availability" defaultValue={speaker?.availability ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="constraints">Contraintes particulières</Label>
              <Input id="constraints" name="constraints" defaultValue={speaker?.constraints ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="technical_needs">Besoins techniques</Label>
              <Input id="technical_needs" name="technical_needs" defaultValue={speaker?.technical_needs ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accessibility_needs">Besoins d’accessibilité</Label>
              <Input id="accessibility_needs" name="accessibility_needs" defaultValue={speaker?.accessibility_needs ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transport">Transport</Label>
              <Input id="transport" name="transport" defaultValue={speaker?.transport ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accommodation">Hébergement</Label>
              <Input id="accommodation" name="accommodation" defaultValue={speaker?.accommodation ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={speaker?.notes ?? ""} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : speaker ? "Enregistrer" : "Créer le speaker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
