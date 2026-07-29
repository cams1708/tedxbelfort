"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { requestAccessAction } from "@/lib/access-requests/actions";
import { Lock } from "lucide-react";

export function RequestAccessButton({
  resourceType,
  resourceId,
  permissionRequested,
  label = "Demander l’accès",
}: {
  resourceType: string;
  resourceId?: string;
  permissionRequested: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    setIsPending(true);
    const result = await requestAccessAction({ resourceType, resourceId, permissionRequested, reason });
    setIsPending(false);
    if (result.error) {
      toast.error("Impossible d’envoyer la demande.");
      return;
    }
    toast.success("Demande envoyée à la super-administratrice.");
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Lock className="size-3.5" /> {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander l’accès</DialogTitle>
          <DialogDescription>
            Cette information n’est pas visible avec vos permissions actuelles. Vous pouvez demander un accès à la
            super-administratrice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Motif (optionnel)</Label>
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
