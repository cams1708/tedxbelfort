"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { prepareDocumentSendAction, sendPreparedDocumentAction } from "@/app/(app)/partners/actions";
import { PlusIcon, Send } from "lucide-react";
import type { Tables } from "@/types/database.types";

const DOCUMENT_TYPES = [
  "Dossier de partenariat",
  "Grille des offres",
  "Convention",
  "Contrat",
  "Facture",
  "RIB",
  "Présentation de l’événement",
  "Invitation",
  "Document personnalisé",
];

const SEND_STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "info" | "success" | "warning" }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  prepared: { label: "Préparé", tone: "info" },
  sent: { label: "Envoyé", tone: "success" },
  opened: { label: "Ouvert", tone: "success" },
  signed: { label: "Signé", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
};

export function PartnerDocumentSends({
  partnerId,
  sends,
  availableDocuments,
  canEdit,
  emailConfigured,
  defaultRecipientEmail,
}: {
  partnerId: string;
  sends: Tables<"partner_document_sends">[];
  availableDocuments: Tables<"documents">[];
  canEdit: boolean;
  emailConfigured: boolean;
  defaultRecipientEmail?: string | null;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    prepareDocumentSendAction.bind(null, partnerId),
  );
  const [sendingId, startSending] = useTransition();

  function handleSend(sendId: string) {
    startSending(async () => {
      const result = await sendPreparedDocumentAction(sendId);
      if (result.error) toast.error(result.error);
      else toast.success("E-mail envoyé.");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documents envoyés</CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon className="size-3.5" /> Préparer un envoi
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Préparer l’envoi d’un document</DialogTitle>
                <DialogDescription>
                  {emailConfigured
                    ? "Une fois préparé, vous pourrez déclencher l’envoi réel de l’e-mail depuis la liste ci-dessous."
                    : "L’envoi réel par e-mail n’est pas encore configuré (Resend) : le document reste au statut « préparé » jusqu’à l’envoi effectif."}
                </DialogDescription>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label>Type de document</Label>
                  <Select name="document_type" defaultValue={DOCUMENT_TYPES[0]}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {availableDocuments.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <Label>Document (facultatif)</Label>
                    <Select name="document_id">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aucun document lié" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDocuments.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="recipient_email">Destinataire</Label>
                  <Input
                    id="recipient_email"
                    name="recipient_email"
                    type="email"
                    defaultValue={defaultRecipientEmail ?? ""}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subject">Objet</Label>
                  <Input id="subject" name="subject" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Préparation…" : "Préparer l’envoi"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {sends.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document préparé pour ce partenaire.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sends.map((send) => {
              const meta = SEND_STATUS_LABELS[send.status] ?? { label: send.status, tone: "neutral" as const };
              return (
                <li key={send.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{send.document_type}</div>
                    <div className="text-muted-foreground">
                      {send.subject} — {send.recipient_email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(send.created_at), "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={meta.label} tone={meta.tone} />
                    {canEdit && emailConfigured && send.status === "prepared" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={sendingId}
                        onClick={() => handleSend(send.id)}
                      >
                        <Send className="size-3.5" /> Envoyer
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
