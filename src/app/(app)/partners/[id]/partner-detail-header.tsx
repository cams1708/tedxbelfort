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
import { PartnerFormDialog } from "@/app/(app)/partners/partner-form-dialog";
import { archivePartnerAction } from "@/app/(app)/partners/actions";
import { PARTNER_PRIORITY_LABELS, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function PartnerDetailHeader({ partner }: { partner: Tables<"partners"> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const status = PARTNER_STATUS_LABELS[partner.status];
  const priority = PARTNER_PRIORITY_LABELS[partner.priority];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{partner.company_name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge label={status.label} tone={status.tone} />
          <StatusBadge label={priority.label} tone={priority.tone} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Can module="partners" action="edit">
          <PartnerFormDialog
            partner={partner}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-3.5" /> Modifier
              </Button>
            }
          />
        </Can>
        <Can module="partners" action="delete">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="size-3.5" /> Archiver
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiver ce partenaire ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le partenaire sera archivé et n’apparaîtra plus dans les listes actives. Cette action peut être
                  tracée dans le journal d’activité.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await archivePartnerAction(partner.id);
                      router.push("/partners");
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
