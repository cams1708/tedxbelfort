import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PermissionMap } from "@/lib/permissions/types";
import type { Tables } from "@/types/database.types";

export interface CurrentUser {
  profile: Tables<"profiles">;
  permissions: PermissionMap;
  eventId: string;
}

/**
 * Loads the signed-in user's profile and their fully-resolved permission map
 * for one event, via the get_effective_permissions() RPC (itself backed by
 * has_permission()/get_scope(), enforced again independently by RLS on every
 * table — this is a convenience for UI gating, never the security boundary
 * itself). Wrapped in React's cache() so the layout and the page it wraps
 * share one query per request instead of doubling every lookup.
 */
export const getCurrentUser = cache(async function getCurrentUser(eventId: string): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  const permissions: PermissionMap = {};

  if (profile.is_super_admin) {
    const { data: catalog } = await supabase.from("permissions").select("module, action");
    for (const row of catalog ?? []) {
      permissions[`${row.module}.${row.action}`] = { allowed: true, scope: "all" };
    }
  } else {
    const { data: rows } = await supabase.rpc("get_effective_permissions", {
      p_user: user.id,
      p_event: eventId,
    });
    for (const row of rows ?? []) {
      permissions[`${row.module}.${row.action}`] = { allowed: row.allowed, scope: row.scope };
    }
  }

  return { profile, permissions, eventId };
});

/** Every event the current user belongs to (or all events, for super_admin). */
export const getAccessibleEvents = cache(async function getAccessibleEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();

  if (profile?.is_super_admin) {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    return data ?? [];
  }

  const { data: memberships } = await supabase
    .from("event_members")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const eventIds = (memberships ?? []).map((m) => m.event_id);
  if (eventIds.length === 0) return [];

  const { data } = await supabase.from("events").select("*").in("id", eventIds).order("event_date", { ascending: true });
  return data ?? [];
});
