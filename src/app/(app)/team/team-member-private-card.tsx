"use client";

import { useActionDialog } from "@/hooks/use-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { updateTeamMemberPrivateAction } from "@/app/(app)/team/actions";
import { Pencil } from "lucide-react";

interface TeamMemberPrivate {
  email: string | null;
  phone: string | null;
  admin_confidential_notes: string | null;
}

export function TeamMemberPrivateCard({
  memberId,
  data,
  canView,
  canEdit,
  isSelf = false,
}: {
  memberId: string;
  data: TeamMemberPrivate | null;
  canView: boolean;
  canEdit: boolean;
  /** The current user viewing their own team roster entry: they may always
   * complete their own contact details, even without `team.edit` — but
   * never the admin-only confidential notes field. */
  isSelf?: boolean;
}) {
  const { open, setOpen, error, isPending, handleAction } = useActionDialog(
    updateTeamMemberPrivateAction.bind(null, memberId),
  );

  const effectiveCanView = canView || isSelf;
  const effectiveCanEdit = canEdit || isSelf;

  if (!effectiveCanView) {
    return <RequestAccessButton resourceType="team" resourceId={memberId} permissionRequested="team.view_personal_data" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{isSelf ? "Mes coordonnées" : "Données personnelles"}</CardTitle>
        {effectiveCanEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Pencil className="size-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isSelf ? "Modifier mes coordonnées" : "Modifier les données personnelles"}</DialogTitle>
              </DialogHeader>
              <form action={handleAction} className="flex flex-col gap-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue={data?.email ?? ""} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" name="phone" defaultValue={data?.phone ?? ""} />
                </div>
                {canEdit ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="admin_confidential_notes">Notes administratives confidentielles</Label>
                    <Textarea
                      id="admin_confidential_notes"
                      name="admin_confidential_notes"
                      rows={3}
                      defaultValue={data?.admin_confidential_notes ?? ""}
                    />
                  </div>
                ) : null}
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">E-mail</span>
          <span>{data?.email || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Téléphone</span>
          <span>{data?.phone || "—"}</span>
        </div>
        {canEdit && data?.admin_confidential_notes ? (
          <div>
            <span className="text-muted-foreground">Notes confidentielles</span>
            <p className="mt-1 whitespace-pre-wrap">{data.admin_confidential_notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
