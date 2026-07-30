"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { createCalendarItemAction } from "@/app/(app)/calendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PlusIcon } from "lucide-react";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  meeting: "Réunion",
  followup: "Relance",
  deadline: "Échéance",
  rehearsal: "Répétition",
  partner_appointment: "Rendez-vous partenaire",
  speaker_appointment: "Rendez-vous speaker",
  payment_date: "Date de paiement",
  contractual_deadline: "Échéance contractuelle",
  internal: "Événement interne",
  d_day: "Jour J",
};

export function CalendarFormDialog({
  defaultDate,
  members,
}: {
  defaultDate?: string;
  members: { id: string; full_name: string }[];
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(createCalendarItemAction);
  const [allDay, setAllDay] = useState(false);
  const [visibility, setVisibility] = useState("all");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon className="size-3.5" /> Nouvel événement
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel événement au calendrier</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select name="type" defaultValue="meeting">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="start_date">Date</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={defaultDate} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allDay}
              onCheckedChange={(value) => setAllDay(value === true)}
              name="all_day"
              value="true"
            />
            Toute la journée
          </label>
          {!allDay ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start_time">Heure de début</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end_time">Heure de fin</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label>Visibilité</Label>
            <Select name="visibility" value={visibility} onValueChange={(v) => typeof v === "string" && setVisibility(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute l’équipe</SelectItem>
                <SelectItem value="pole">Mon pôle</SelectItem>
                <SelectItem value="assigned">Personnes attribuées uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {visibility === "assigned" ? (
            <div className="flex flex-col gap-2">
              <Label>Personnes assignées</Label>
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun membre avec un compte sur cet événement.</p>
              ) : (
                <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <Checkbox name="attendee_ids" value={m.id} />
                      {m.full_name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
