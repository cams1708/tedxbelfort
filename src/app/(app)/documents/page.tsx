import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { Can } from "@/lib/permissions/context";
import { DocumentUploadDialog } from "@/app/(app)/documents/document-upload-dialog";
import { DocumentsExplorer } from "@/app/(app)/documents/documents-explorer";

export default async function DocumentsPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Espace documentaire centralisé. Seuls les documents que vous êtes autorisé(e) à voir apparaissent ici.
          </p>
        </div>
        <Can module="documents" action="create">
          <DocumentUploadDialog />
        </Can>
      </div>
      <DocumentsExplorer documents={documents ?? []} />
    </div>
  );
}
