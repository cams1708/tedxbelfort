"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_EVENT_COOKIE } from "@/lib/events/current-event";

export async function setCurrentEventAction(eventId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_EVENT_COOKIE, eventId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/dashboard");
}
