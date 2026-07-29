"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Can } from "@/lib/permissions/context";
import { TeamFormDialog } from "@/app/(app)/team/team-form-dialog";
import { TeamMemberPrivateCard } from "@/app/(app)/team/team-member-private-card";
import { archiveTeamMemberAction } from "@/app/(app)/team/actions";
import { TEAM_POLE_LABELS } from "@/lib/labels";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";

interface TeamMemberPrivate {
  email: string | null;
  phone: string | null;
  admin_confidential_notes: string | null;
}

export function TeamMemberSheet({
  member,
  privateData,
  canViewPersonal,
  canEdit,
  canDelete,
  isSelf = false,
  accounts,
}: {
  member: Tables<"team_members">;
  privateData: TeamMemberPrivate | null;
  canViewPersonal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isSelf?: boolean;
  accounts: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button type="button" className="font-medium hover:underline" />
        }
      >
        {member.first_name} {member.last_name}
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {member.first_name} {member.last_name}
          </SheetTitle>
          <SheetDescription>{member.role_label || TEAM_POLE_LABELS[member.pole]}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pôle</span>
            <span>{TEAM_POLE_LABELS[member.pole]}</span>
          </div>
          {member.arrival_date ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrivée</span>
              <span>{new Date(member.arrival_date).toLocaleDateString("fr-FR")}</span>
            </div>
          ) : null}
          {member.availability ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Disponibilités</span>
              <span>{member.availability}</span>
            </div>
          ) : null}
          {member.workload_notes ? (
            <div>
              <span className="text-muted-foreground">Charge de travail</span>
              <p className="mt-1">{member.workload_notes}</p>
            </div>
          ) : null}
        </div>

        <div className="px-4">
          <TeamMemberPrivateCard
            memberId={member.id}
            data={privateData}
            canView={canViewPersonal}
            canEdit={canEdit}
            isSelf={isSelf}
          />
        </div>

        <div className="mt-auto flex items-center gap-2 px-4 pb-4">
          {canEdit ? (
            <TeamFormDialog
              member={member}
              accounts={accounts}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-3.5" /> Modifier
                </Button>
              }
            />
          ) : null}
          <Can module="team" action="delete">
            {canDelete ? (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  <Trash2 className="size-3.5" /> Archiver
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archiver ce membre ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le membre sera archivé et n’apparaîtra plus dans les listes actives.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await archiveTeamMemberAction(member.id);
                          setOpen(false);
                          router.refresh();
                        })
                      }
                    >
                      Archiver
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </Can>
        </div>
      </SheetContent>
    </Sheet>
  );
}
