import "server-only";
import { cookies } from "next/headers";
import { getAccessibleEvents } from "@/lib/permissions/server";

export const CURRENT_EVENT_COOKIE = "tedx_current_event";

/**
 * Resolves which event the current request should operate on: the cookie
 * value if the user still has access to it, otherwise the first event they
 * can access. Returns null if they have access to none.
 */
export async function resolveCurrentEventId(): Promise<string | null> {
  const events = await getAccessibleEvents();
  if (events.length === 0) return null;

  const cookieStore = await cookies();
  const requested = cookieStore.get(CURRENT_EVENT_COOKIE)?.value;
  if (requested && events.some((e) => e.id === requested)) {
    return requested;
  }

  return events[0].id;
}
