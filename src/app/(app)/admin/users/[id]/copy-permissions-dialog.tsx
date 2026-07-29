"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { copyPermissionsAction } from "@/app/(app)/admin/users/actions";
import { Copy } from "lucide-react";

export function CopyPermissionsDialog({
  eventId,
  targetUserId,
  otherMembers,
}: {
  eventId: string;
  targetUserId: string;
  otherMembers: { userId: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(otherMembers[0]?.userId ?? "");
  const [isPending, startTransition] = useTransition();

  if (otherMembers.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Copy className="size-3.5" /> Copier les permissions d’un autre utilisateur
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copier les permissions</DialogTitle>
          <DialogDescription>Le rôle et toutes les exceptions individuelles de la source seront copiés.</DialogDescription>
        </DialogHeader>
        <Select value={sourceId} onValueChange={(v) => typeof v === "string" && setSourceId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {otherMembers.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await copyPermissionsAction(eventId, sourceId, targetUserId);
                setOpen(false);
              })
            }
          >
            {isPending ? "Copie…" : "Copier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
