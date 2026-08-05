"use client";

import { useState, useTransition } from "react";
import { inviteUserAction } from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { UserPlus, Copy, Check } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function InviteUserDialog({ roles }: { roles: Tables<"roles">[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [inviteLink, setInviteLink] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await inviteUserAction(formData);
      if (result.error) {
        setError(result.error);
        setInviteLink(undefined);
      } else {
        setError(undefined);
        setInviteLink(result.inviteLink);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(undefined);
      setInviteLink(undefined);
      setCopied(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus /> Inviter un utilisateur
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Un e-mail d’invitation sera tenté, mais l’envoi automatique n’est pas toujours fiable — un lien de
            connexion direct sera aussi fourni pour l’envoyer manuellement en secours.
          </DialogDescription>
        </DialogHeader>
        {inviteLink ? (
          <div className="flex flex-col gap-3">
            <Alert>
              <AlertDescription>
                Invitation créée. Envoie ce lien manuellement (e-mail, SMS, WhatsApp…) — il connecte directement la
                personne, sans mot de passe.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input readOnly value={inviteLink} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Terminer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleAction} className="flex flex-col gap-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rôle</Label>
              <Select name="roleId" defaultValue={roles[0]?.id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Envoi…" : "Envoyer l’invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
