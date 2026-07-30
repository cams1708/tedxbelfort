"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { uploadDocumentAction } from "@/app/(app)/documents/actions";
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
import { DOCUMENT_CONFIDENTIALITY_LABELS, DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { UploadIcon } from "lucide-react";

export function DocumentUploadDialog() {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(uploadDocumentAction);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UploadIcon /> Ajouter un document
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>Le fichier est stocké de façon privée et jamais rendu public.</DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Fichier</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom du document</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Catégorie</Label>
              <Select name="category" defaultValue="administrative">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Confidentialité</Label>
              <Select name="confidentiality_level" defaultValue="team_public">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CONFIDENTIALITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Envoi…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
