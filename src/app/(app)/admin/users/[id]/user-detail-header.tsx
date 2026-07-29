"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  assignRoleAction,
  setEventMemberStatusAction,
  setProfileActiveAction,
} from "@/app/(app)/admin/users/actions";
import type { Tables } from "@/types/database.types";

export function UserDetailHeader({
  member,
  profile,
  roles,
  email,
  isSuperAdminActor,
}: {
  member: Tables<"event_members">;
  profile: Tables<"profiles">;
  roles: Tables<"roles">[];
  email: string | null;
  isSuperAdminActor: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
        <div className="mt-1 flex items-center gap-2">
          {profile.is_active === false ? (
            <StatusBadge label="Compte désactivé" tone="danger" />
          ) : member.status === "inactive" ? (
            <StatusBadge label="Accès désactivé pour cet événement" tone="warning" />
          ) : (
            <StatusBadge label="Actif" tone="success" />
          )}
          <span className="text-xs text-muted-foreground">
            Dernière connexion :{" "}
            {profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString("fr-FR") : "jamais"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Rôle</span>
          <Select
            value={member.role_id}
            onValueChange={(v) => typeof v === "string" && startTransition(() => void assignRoleAction(member.id, v))}
          >
            <SelectTrigger size="sm" className="w-56">
              <SelectValue />
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

        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(
              () => void setEventMemberStatusAction(member.id, member.status === "active" ? "inactive" : "active"),
            )
          }
        >
          {member.status === "active" ? "Désactiver l’accès à l’événement" : "Réactiver l’accès à l’événement"}
        </Button>

        {isSuperAdminActor ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => void setProfileActiveAction(profile.id, !profile.is_active))}
          >
            {profile.is_active ? "Désactiver le compte globalement" : "Réactiver le compte globalement"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
