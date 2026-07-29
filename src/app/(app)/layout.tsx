import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PermissionProvider } from "@/lib/permissions/context";
import { getAccessibleEvents, getCurrentUser } from "@/lib/permissions/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const eventId = await resolveCurrentEventId();

  if (!eventId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Aucun événement accessible</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Votre compte n’est rattaché à aucun événement pour le moment. Contactez une administratrice de la plateforme.
        </p>
      </div>
    );
  }

  const [currentUser, events] = await Promise.all([getCurrentUser(eventId), getAccessibleEvents()]);

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.profile.is_active) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Compte désactivé</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Votre accès à la plateforme a été désactivé. Contactez une administratrice si vous pensez qu’il s’agit d’une erreur.
        </p>
      </div>
    );
  }

  return (
    <PermissionProvider value={{ profile: currentUser.profile, permissions: currentUser.permissions, eventId }}>
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar events={events} currentEventId={eventId} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PermissionProvider>
  );
}
