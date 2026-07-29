"use client";

import { useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  setPermissionOverrideAction,
  setScopeOverrideAction,
  resetPermissionsToRoleAction,
} from "@/app/(app)/admin/users/actions";
import { MODULE_LABELS, ACTION_LABELS, MODULES, SCOPED_MODULES, type Module, type Action } from "@/lib/permissions/constants";
import { cn } from "@/lib/utils";

interface PermissionRow {
  id: string;
  module: string;
  action: string;
  is_sensitive: boolean;
}

interface EffectiveEntry {
  allowed: boolean;
  scope: string;
}

export function PermissionMatrix({
  eventId,
  targetUserId,
  permissions,
  effective,
}: {
  eventId: string;
  targetUserId: string;
  permissions: PermissionRow[];
  effective: Record<string, EffectiveEntry>;
}) {
  const [, startTransition] = useTransition();
  const [optimisticEffective, setOptimisticEffective] = useOptimistic(
    effective,
    (state, update: { id: string; allowed?: boolean; scope?: string }) => ({
      ...state,
      [update.id]: {
        allowed: update.allowed ?? state[update.id]?.allowed ?? false,
        scope: update.scope ?? state[update.id]?.scope ?? "none",
      },
    }),
  );

  const byModule = new Map<string, PermissionRow[]>();
  for (const p of permissions) {
    byModule.set(p.module, [...(byModule.get(p.module) ?? []), p]);
  }

  function toggle(permission: PermissionRow, checked: boolean) {
    startTransition(() => {
      setOptimisticEffective({ id: permission.id, allowed: checked });
      void setPermissionOverrideAction(eventId, targetUserId, permission.id, checked);
    });
  }

  function changeScope(modulePermissions: PermissionRow[], scope: string) {
    const relevant = modulePermissions.filter((p) => p.action === "view" || p.action === "edit");
    startTransition(() => {
      for (const p of relevant) setOptimisticEffective({ id: p.id, scope });
      void setScopeOverrideAction(
        eventId,
        targetUserId,
        relevant.map((p) => p.id),
        scope as "all" | "assigned" | "own" | "none",
      );
    });
  }

  function bulkSet(allowed: boolean) {
    startTransition(() => {
      for (const p of permissions) setOptimisticEffective({ id: p.id, allowed });
      for (const p of permissions) void setPermissionOverrideAction(eventId, targetUserId, p.id, allowed);
    });
  }

  function resetToRole() {
    startTransition(() => void resetPermissionsToRoleAction(eventId, targetUserId));
  }

  const sensitivePermissions = permissions.filter((p) => p.is_sensitive);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => bulkSet(true)}>
          Tout autoriser
        </Button>
        <Button variant="outline" size="sm" onClick={() => bulkSet(false)}>
          Tout interdire
        </Button>
        <Button variant="outline" size="sm" onClick={resetToRole}>
          Réinitialiser selon le rôle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrice de permissions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {MODULES.map((module) => {
            const modulePermissions = byModule.get(module) ?? [];
            if (modulePermissions.length === 0) return null;
            const isScoped = SCOPED_MODULES.includes(module as Module);
            const viewPermission = modulePermissions.find((p) => p.action === "view");
            const currentScope = viewPermission ? (optimisticEffective[viewPermission.id]?.scope ?? "none") : "none";

            return (
              <div key={module} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{MODULE_LABELS[module as Module]}</span>
                  {isScoped ? (
                    <Select value={currentScope} onValueChange={(v) => typeof v === "string" && changeScope(modulePermissions, v)}>
                      <SelectTrigger size="sm" className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les fiches</SelectItem>
                        <SelectItem value="assigned">Fiches attribuées</SelectItem>
                        <SelectItem value="own">Fiches créées</SelectItem>
                        <SelectItem value="none">Aucun accès</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  {modulePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                        permission.is_sensitive && "border-amber-500/40 bg-amber-500/5",
                      )}
                    >
                      <Checkbox
                        checked={optimisticEffective[permission.id]?.allowed ?? false}
                        onCheckedChange={(value) => toggle(permission, value === true)}
                      />
                      {ACTION_LABELS[permission.action as Action] ?? permission.action}
                    </label>
                  ))}
                </div>
                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {sensitivePermissions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations sensibles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {sensitivePermissions.map((permission) => (
              <label key={permission.id} className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-xs">
                <Checkbox
                  checked={optimisticEffective[permission.id]?.allowed ?? false}
                  onCheckedChange={(value) => toggle(permission, value === true)}
                />
                {MODULE_LABELS[permission.module as Module]} — {ACTION_LABELS[permission.action as Action] ?? permission.action}
              </label>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
