"use client";

import { useState, useTransition } from "react";
import { generateSignInLinkAction } from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ResendLinkButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function generate() {
    startTransition(async () => {
      const result = await generateSignInLinkAction(email);
      if (result.error || !result.inviteLink) {
        toast.error(result.error ?? "Impossible de générer le lien.");
        return;
      }
      await navigator.clipboard.writeText(result.inviteLink);
      setCopied(true);
      toast.success("Lien copié — colle-le pour l’envoyer manuellement.");
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={isPending} onClick={generate} title="Copier un lien de connexion">
      {copied ? <Check className="size-3.5" /> : isPending ? <Link2 className="size-3.5 animate-pulse" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
