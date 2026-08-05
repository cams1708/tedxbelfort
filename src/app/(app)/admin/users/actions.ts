"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { inviteUserSchema } from "@/lib/validations/admin";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export interface InviteActionState extends ActionState {
  inviteLink?: string;
}

export async function inviteUserAction(formData: FormData): Promise<InviteActionState> {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return { error: "Aucun événement sélectionné." };

  const parsed = inviteUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const {
    data: { user: actingUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", actingUser?.id ?? "").single();
  if (!profile?.is_super_admin) {
    const { data: canInvite } = await supabase.rpc("has_permission", {
      p_user: actingUser?.id ?? "",
      p_event: eventId,
      p_module: "users",
      p_action: "create",
    });
    if (!canInvite) return { error: "Vous n’avez pas la permission d’inviter des utilisateurs." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/accept-invite`,
    data: { full_name: parsed.data.fullName },
  });

  if (inviteError || !invited.user) {
    return { error: "Échec de l’invitation (" + (inviteError?.message ?? "erreur inconnue") + ")" };
  }

  const { error: memberError } = await supabase.from("event_members").insert({
    event_id: eventId,
    user_id: invited.user.id,
    role_id: parsed.data.roleId,
    invited_by: actingUser?.id ?? null,
  });

  if (memberError) return { error: "Invitation envoyée mais l’attribution au rôle a échoué (" + memberError.message + ")" };

  // Supabase's own invite e-mail relies on its built-in mail service (very
  // low rate limit, meant for testing — real invite e-mails routinely never
  // arrive). Always hand back a direct sign-in link too, so it can be
  // shared manually (personal e-mail, SMS, WhatsApp...) regardless of
  // whether Supabase's own e-mail gets delivered.
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: parsed.data.email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/accept-invite` },
  });

  revalidatePath("/admin/users");
  return { success: true, inviteLink: linkData?.properties?.action_link };
}

export async function generateSignInLinkAction(email: string): Promise<InviteActionState> {
  const supabase = await createClient();
  const {
    data: { user: actingUser },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", actingUser?.id ?? "").single();
  if (!profile?.is_super_admin) return { error: "Réservé à la super-administratrice." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  // If this account never finished setting its password (still pending an
  // initial invite), route through /accept-invite so they land on the
  // "create your password" screen instead of being silently signed in.
  // Once they're fully activated, a plain sign-in link (site root) is enough.
  const { data: userList } = await admin.auth.admin.listUsers();
  const existingUser = userList?.users.find((u) => u.email === email);
  const needsPasswordSetup = !existingUser?.last_sign_in_at;
  const redirectTo = needsPasswordSetup ? `${siteUrl}/auth/callback?next=/accept-invite` : siteUrl;

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !linkData?.properties?.action_link) {
    return { error: "Impossible de générer le lien (" + (error?.message ?? "erreur inconnue") + ")" };
  }
  return { success: true, inviteLink: linkData.properties.action_link };
}

export async function setEventMemberStatusAction(memberId: string, status: "active" | "inactive"): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_members").update({ status }).eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function setProfileActiveAction(userId: string, isActive: boolean): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { error: "Action réservée à la super-administratrice (" + error.message + ")" };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function assignRoleAction(memberId: string, roleId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_members").update({ role_id: roleId }).eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function setPermissionOverrideAction(
  eventId: string,
  targetUserId: string,
  permissionId: string,
  allowed: boolean,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("user_permission_overrides")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", targetUserId)
    .eq("permission_id", permissionId);

  const { error } = await supabase.from("user_permission_overrides").insert({
    event_id: eventId,
    user_id: targetUserId,
    permission_id: permissionId,
    allowed,
    granted_by: user?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export async function setScopeOverrideAction(
  eventId: string,
  targetUserId: string,
  permissionIds: string[],
  scope: "all" | "assigned" | "own" | "none",
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existingOverrides } = await supabase
    .from("user_permission_overrides")
    .select("permission_id, allowed")
    .eq("event_id", eventId)
    .eq("user_id", targetUserId)
    .in("permission_id", permissionIds);

  const { data: rolePermissions } = await supabase
    .from("event_members")
    .select("role_id")
    .eq("event_id", eventId)
    .eq("user_id", targetUserId)
    .single();

  const { data: roleGrants } = rolePermissions
    ? await supabase
        .from("role_permissions")
        .select("permission_id, allowed")
        .eq("role_id", rolePermissions.role_id)
        .in("permission_id", permissionIds)
    : { data: [] };

  const allowedByPermission = new Map<string, boolean>();
  for (const g of roleGrants ?? []) allowedByPermission.set(g.permission_id, g.allowed);
  for (const o of existingOverrides ?? []) allowedByPermission.set(o.permission_id, o.allowed);

  await supabase
    .from("user_permission_overrides")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", targetUserId)
    .in("permission_id", permissionIds);

  const rows = permissionIds.map((permissionId) => ({
    event_id: eventId,
    user_id: targetUserId,
    permission_id: permissionId,
    allowed: allowedByPermission.get(permissionId) ?? false,
    scope,
    granted_by: user?.id ?? null,
  }));

  const { error } = await supabase.from("user_permission_overrides").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export async function resetPermissionsToRoleAction(eventId: string, targetUserId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_permission_overrides")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", targetUserId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export async function copyPermissionsAction(
  eventId: string,
  sourceUserId: string,
  targetUserId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sourceMember } = await supabase
    .from("event_members")
    .select("role_id")
    .eq("event_id", eventId)
    .eq("user_id", sourceUserId)
    .single();

  if (sourceMember) {
    await supabase
      .from("event_members")
      .update({ role_id: sourceMember.role_id })
      .eq("event_id", eventId)
      .eq("user_id", targetUserId);
  }

  const { data: sourceOverrides } = await supabase
    .from("user_permission_overrides")
    .select("permission_id, allowed, scope, resource_type, resource_id, expires_at")
    .eq("event_id", eventId)
    .eq("user_id", sourceUserId);

  await supabase.from("user_permission_overrides").delete().eq("event_id", eventId).eq("user_id", targetUserId);

  if (sourceOverrides && sourceOverrides.length > 0) {
    const rows = sourceOverrides.map((o) => ({
      event_id: eventId,
      user_id: targetUserId,
      permission_id: o.permission_id,
      allowed: o.allowed,
      scope: o.scope,
      resource_type: o.resource_type,
      resource_id: o.resource_id,
      expires_at: o.expires_at,
      granted_by: user?.id ?? null,
    }));
    await supabase.from("user_permission_overrides").insert(rows);
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export async function reviewAccessRequestAction(
  requestId: string,
  decision: "approved" | "approved_temporary" | "denied",
  expiresInDays?: number,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request } = await supabase.from("access_requests").select("*").eq("id", requestId).single();
  if (!request) return { error: "Demande introuvable." };

  if (decision !== "denied") {
    const { data: permission } = await supabase
      .from("permissions")
      .select("id")
      .eq("key", request.permission_requested)
      .single();

    if (permission) {
      const expiresAt =
        decision === "approved_temporary" && expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

      await supabase.from("user_permission_overrides").insert({
        event_id: request.event_id,
        user_id: request.user_id,
        permission_id: permission.id,
        allowed: true,
        resource_type: request.resource_type,
        resource_id: request.resource_id,
        expires_at: expiresAt,
        granted_by: user?.id ?? null,
      });
    }
  }

  const { error } = await supabase
    .from("access_requests")
    .update({ status: decision, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}
