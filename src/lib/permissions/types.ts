import type { Action, Module } from "@/lib/permissions/constants";
import type { Enums } from "@/types/database.types";

export type Scope = Enums<"permission_scope">;

export interface PermissionEntry {
  allowed: boolean;
  scope: Scope;
}

/** Keyed by "module.action", e.g. "partners.view". */
export type PermissionMap = Record<string, PermissionEntry>;

export function can(map: PermissionMap, module: Module, action: Action): boolean {
  return map[`${module}.${action}`]?.allowed ?? false;
}

export function scopeOf(map: PermissionMap, module: Module, action: Action = "view"): Scope {
  return map[`${module}.${action}`]?.scope ?? "none";
}

export function emptyPermissionMap(): PermissionMap {
  return {};
}
