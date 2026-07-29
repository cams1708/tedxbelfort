import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequestAccessButton } from "@/components/shared/request-access-button";

const ACTION_LABELS: Record<string, string> = {
  login: "Connexion",
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  download: "Téléchargement",
  status_change: "Changement de statut",
  permission_change: "Changement de permission",
  user_added: "Utilisateur ajouté",
  user_removed: "Utilisateur retiré",
  partner_validated: "Partenaire validé",
  view_sensitive: "Consultation d’une information sensible",
};

export default async function ActivityLogPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  if (!currentUser.profile.is_super_admin) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Historique d’activité</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Le journal d’activité complet est réservé à la super-administratrice.
        </p>
        <RequestAccessButton resourceType="activity_log" permissionRequested="activity_log.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(100);

  const logList = logs ?? [];
  const userIds = Array.from(new Set(logList.map((l) => l.user_id).filter((id): id is string => !!id)));
  const { data: profiles } =
    userIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Historique d’activité</h1>
        <p className="text-sm text-muted-foreground">Les 100 dernières actions enregistrées pour cet événement.</p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Ressource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucune activité enregistrée.
                </TableCell>
              </TableRow>
            ) : (
              logList.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>{log.user_id ? (nameById.get(log.user_id) ?? "—") : "Système"}</TableCell>
                  <TableCell>{ACTION_LABELS[log.action] ?? log.action}</TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.resource_type ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
