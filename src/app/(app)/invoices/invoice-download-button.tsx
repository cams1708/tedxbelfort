"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getInvoiceFileUrlAction } from "@/app/(app)/invoices/actions";
import { Download } from "lucide-react";

export function InvoiceDownloadButton({ documentId }: { documentId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleDownload() {
    setIsPending(true);
    const result = await getInvoiceFileUrlAction(documentId);
    setIsPending(false);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Téléchargement impossible.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={() => void handleDownload()}>
      <Download className="size-3.5" />
    </Button>
  );
}
