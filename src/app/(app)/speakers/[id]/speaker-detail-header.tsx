"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Can } from "@/lib/permissions/context";
import { SpeakerFormDialog } from "@/app/(app)/speakers/speaker-form-dialog";
import { archiveSpeakerAction } from "@/app/(app)/speakers/actions";
import { SPEAKER_STATUS_LABELS } from "@/lib/labels";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function SpeakerDetailHeader({ speaker }: { speaker: Tables<"speakers"> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const status = SPEAKER_STATUS_LABELS[speaker.status];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">
          {speaker.first_name} {speaker.last_name}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge label={status.label} tone={status.tone} />
          {speaker.talk_title ? <span className="text-sm text-muted-foreground">{speaker.talk_title}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Can module="speakers" action="edit">
          <SpeakerFormDialog
            speaker={speaker}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" /> Modifier
              </Button>
            }
          />
        </Can>
        <Can module="speakers" action="delete">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="size-3.5" /> Archiver
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiver ce speaker ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le speaker sera archivé et n’apparaîtra plus dans les listes actives.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await archiveSpeakerAction(speaker.id);
                      router.push("/speakers");
                    })
                  }
                >
                  Archiver
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Can>
      </div>
    </div>
  );
}
