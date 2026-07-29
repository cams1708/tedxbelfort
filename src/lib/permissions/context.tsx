"use client";

import { createContext, useContext } from "react";
import type { Action, Module } from "@/lib/permissions/constants";
import { can, scopeOf, type PermissionMap, type Scope } from "@/lib/permissions/types";
import type { Tables } from "@/types/database.types";

interface PermissionContextValue {
  profile: Tables<"profiles">;
  permissions: PermissionMap;
  eventId: string;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  value,
  children,
}: {
  value: PermissionContextValue;
  children: React.ReactNode;
}) {
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

function useContextValue() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionProvider");
  return ctx;
}

export function usePermissions() {
  const { permissions, profile } = useContextValue();
  return {
    can: (module: Module, action: Action) => profile.is_super_admin || can(permissions, module, action),
    scopeOf: (module: Module, action?: Action): Scope => (profile.is_super_admin ? "all" : scopeOf(permissions, module, action)),
  };
}

export function useCurrentProfile() {
  return useContextValue().profile;
}

export function useCurrentEventId() {
  return useContextValue().eventId;
}

/** Renders children only if the current user holds the given permission. */
export function Can({
  module,
  action,
  fallback = null,
  children,
}: {
  module: Module;
  action: Action;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can: hasPermission } = usePermissions();
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
}
