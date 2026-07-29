"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addTimelineEntryAction } from "@/app/(app)/speakers/actions";
import { PlusIcon } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function SpeakerTimeline({
  speakerId,
  entries,
  canView,
  canEdit,
}: {
  speakerId: string;
  entries: Tables<"speaker_timeline">[];
  canView: boolean;
  canEdit: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(addTimelineEntryAction.bind(null, speakerId));

  if (!canView) {
    return (
      <Card>
        <CardContent className="pt-6">
          <RequestAccessButton resourceType="speakers" resourceId={speakerId} permissionRequested="speakers.view_history" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Suivi</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon className="size-3.5" /> Ajouter une entrée
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une entrée de suivi</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="event_type">Type</Label>
                  <Input id="event_type" name="event_type" placeholder="ex : note, status_change" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea id="note" name="note" rows={3} />
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
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune entrée pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li key={entry.id} className="border-l-2 border-muted pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{entry.event_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </span>
                </div>
                {entry.note ? <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
