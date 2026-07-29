"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getPreviewPermissionsAction, type PreviewPermission } from "@/app/(app)/admin/users/preview-actions";
import { MODULE_LABELS, type Module } from "@/lib/permissions/constants";
import { Eye } from "lucide-react";

export function PreviewAccessDialog({ eventId, targetUserId }: { eventId: string; targetUserId: string }) {
  const [permissions, setPermissions] = useState<PreviewPermission[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenChange(open: boolean) {
    if (open && permissions === null) {
      setLoading(true);
      const data = await getPreviewPermissionsAction(eventId, targetUserId);
      setPermissions(data);
      setLoading(false);
    }
  }

  const visibleModules = permissions
    ? Array.from(new Set(permissions.filter((p) => p.action === "view" && p.allowed).map((p) => p.module)))
    : [];

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Eye className="size-3.5" /> Prévisualiser les accès
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aperçu des accès</DialogTitle>
          <DialogDescription>
            Simulation en lecture seule — vous ne changez pas de compte, ceci montre uniquement ce que cet utilisateur
            peut voir.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : visibleModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun module accessible avec les permissions actuelles.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {visibleModules.map((module) => (
              <li key={module} className="rounded-md bg-muted px-3 py-1.5">
                {MODULE_LABELS[module as Module] ?? module}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
