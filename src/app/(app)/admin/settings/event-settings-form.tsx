"use client";

import { useActionState } from "react";
import { updateEventSettingsAction, type ActionState } from "@/app/(app)/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tables } from "@/types/database.types";

const initialState: ActionState = {};

export function EventSettingsForm({ event, canEdit }: { event: Tables<"events">; canEdit: boolean }) {
  const [state, formAction, isPending] = useActionState(
    (_prev: ActionState, formData: FormData) => updateEventSettingsAction(event.id, formData),
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations de l’événement</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state.success ? (
            <Alert>
              <AlertDescription>Paramètres enregistrés.</AlertDescription>
            </Alert>
          ) : null}
          <fieldset disabled={!canEdit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="name">Nom de l’événement</Label>
              <Input id="name" name="name" defaultValue={event.name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="theme">Thème</Label>
              <Input id="theme" name="theme" defaultValue={event.theme ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Lieu</Label>
              <Input id="location" name="location" defaultValue={event.location ?? ""} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} defaultValue={event.description ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="event_date">Date de l’événement</Label>
              <Input id="event_date" name="event_date" type="date" defaultValue={event.event_date ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue={event.status}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">En préparation</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sponsoring_goal">Objectif de sponsoring</Label>
              <Input id="sponsoring_goal" name="sponsoring_goal" type="number" step="0.01" defaultValue={event.sponsoring_goal ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="budget_forecast">Budget prévisionnel</Label>
              <Input id="budget_forecast" name="budget_forecast" type="number" step="0.01" defaultValue={event.budget_forecast ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Devise</Label>
              <Input id="currency" name="currency" defaultValue={event.currency} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color_primary">Couleur principale</Label>
              <Input id="color_primary" name="color_primary" type="color" defaultValue={event.color_primary ?? "#e62b1e"} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color_secondary">Couleur secondaire</Label>
              <Input id="color_secondary" name="color_secondary" type="color" defaultValue={event.color_secondary ?? "#000000"} />
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
