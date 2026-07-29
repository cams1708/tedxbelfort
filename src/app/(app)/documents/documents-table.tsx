"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { DOCUMENT_CONFIDENTIALITY_LABELS } from "@/lib/labels";
import { getSignedDownloadUrlAction, archiveDocumentAction } from "@/app/(app)/documents/actions";
import { usePermissions } from "@/lib/permissions/context";
import { Download, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";

const CATEGORY_LABELS: Record<string, string> = {
  partners: "Partenaires",
  speakers: "Speakers",
  contracts: "Contrats",
  conventions: "Conventions",
  invoices: "Factures",
  communication: "Communication",
  administrative: "Administratif",
  budget: "Budget",
  logistics: "Logistique",
  technical: "Technique",
  team: "Équipe",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function DocumentsTable({ documents }: { documents: Tables<"documents">[] }) {
  const { can } = usePermissions();
  const canDelete = can("documents", "delete");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDownload(documentId: string) {
    setDownloadingId(documentId);
    const result = await getSignedDownloadUrlAction(documentId);
    setDownloadingId(null);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Téléchargement impossible.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Confidentialité</TableHead>
            <TableHead>Taille</TableHead>
            <TableHead>Ajouté le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Aucun document.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{CATEGORY_LABELS[doc.category] ?? doc.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {DOCUMENT_CONFIDENTIALITY_LABELS[doc.confidentiality_level]}
                </TableCell>
                <TableCell>{formatSize(doc.file_size)}</TableCell>
                <TableCell>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={downloadingId === doc.id}
                    onClick={() => void handleDownload(doc.id)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  {canDelete ? (
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="size-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le document sera archivé et ne sera plus accessible aux membres de l’équipe.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => startTransition(() => void archiveDocumentAction(doc.id))}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
