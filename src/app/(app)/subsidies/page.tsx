import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RequestAccessButton } from "@/components/shared/request-access-button";
import { Can } from "@/lib/permissions/context";
import { ExportButton } from "@/components/shared/export-button";
import { SubsidyFormDialog } from "@/app/(app)/subsidies/subsidy-form-dialog";
import { SubsidyDeleteButton } from "@/app/(app)/subsidies/subsidy-delete-button";
import { SUBSIDY_STATUS_LABELS } from "@/lib/labels";
import { prepareExportRows, type ExportColumn } from "@/lib/export/csv";
import type { Tables } from "@/types/database.types";

export default async function SubsidiesPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const hasAll = currentUser.profile.is_super_admin;
  const canView = hasAll || can(currentUser.permissions, "subsidies", "view");
  const canEdit = hasAll || can(currentUser.permissions, "subsidies", "edit");
  const canDelete = hasAll || can(currentUser.permissions, "subsidies", "delete");
  const canExport = hasAll || can(currentUser.permissions, "subsidies", "export");

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Subventions</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Vous n’avez pas accès aux subventions de cet événement.
        </p>
        <RequestAccessButton resourceType="subsidies" permissionRequested="subsidies.view" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: event }, { data: subsidies }] = await Promise.all([
    supabase.from("events").select("currency").eq("id", eventId).single(),
    supabase.from("subsidies").select("*").eq("event_id", eventId).order("name"),
  ]);

  const subsidyList = subsidies ?? [];
  const currency = event?.currency ?? "EUR";
  const formatAmount = (value: number | null) =>
    value === null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  const exportColumns: ExportColumn<Tables<"subsidies">>[] = [
    { label: "Nom", value: (s) => s.name },
    { label: "Organisme", value: (s) => s.grantor ?? "" },
    { label: "Demandé", value: (s) => (s.amount_requested !== null ? Number(s.amount_requested) : "") },
    { label: "Accordé", value: (s) => (s.amount_granted !== null ? Number(s.amount_granted) : "") },
    { label: "Versé", value: (s) => Number(s.amount_received) },
    {
      label: "Restant à recevoir",
      value: (s) => (s.amount_granted !== null ? Number(s.amount_granted) - Number(s.amount_received) : ""),
    },
    { label: "Statut", value: (s) => SUBSIDY_STATUS_LABELS[s.status]?.label ?? s.status },
  ];
  const subsidyExport = prepareExportRows(subsidyList, exportColumns);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subventions</h1>
          <p className="text-sm text-muted-foreground">Suivi des demandes de subvention jusqu’à leur versement.</p>
        </div>
        <div className="flex items-center gap-2">
          {canExport ? (
            <ExportButton filename="subventions" sheetName="Subventions" headers={subsidyExport.headers} data={subsidyExport.data} />
          ) : null}
          <Can module="subsidies" action="create">
            <SubsidyFormDialog />
          </Can>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Organisme</TableHead>
              <TableHead>Demandé</TableHead>
              <TableHead>Accordé</TableHead>
              <TableHead>Versé</TableHead>
              <TableHead>Restant à recevoir</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subsidyList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Aucune subvention pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              subsidyList.map((s) => {
                const meta = SUBSIDY_STATUS_LABELS[s.status];
                const remaining = s.amount_granted !== null ? Number(s.amount_granted) - Number(s.amount_received) : null;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {canEdit ? (
                        <SubsidyFormDialog
                          subsidy={s}
                          trigger={
                            <button type="button" className="text-left font-medium hover:underline">
                              {s.name}
                            </button>
                          }
                        />
                      ) : (
                        <span className="font-medium">{s.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.grantor ?? "—"}</TableCell>
                    <TableCell>{formatAmount(s.amount_requested !== null ? Number(s.amount_requested) : null)}</TableCell>
                    <TableCell>{formatAmount(s.amount_granted !== null ? Number(s.amount_granted) : null)}</TableCell>
                    <TableCell>{formatAmount(Number(s.amount_received))}</TableCell>
                    <TableCell>{formatAmount(remaining)}</TableCell>
                    <TableCell>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canDelete ? <SubsidyDeleteButton subsidyId={s.id} /> : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
