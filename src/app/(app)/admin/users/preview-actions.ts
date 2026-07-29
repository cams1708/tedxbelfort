"use server";

import { createClient } from "@/lib/supabase/server";

export interface PreviewPermission {
  module: string;
  action: string;
  allowed: boolean;
  scope: string;
}

export async function getPreviewPermissionsAction(eventId: string, targetUserId: string): Promise<PreviewPermission[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_effective_permissions", {
    p_user: targetUserId,
    p_event: eventId,
  });
  return data ?? [];
}
