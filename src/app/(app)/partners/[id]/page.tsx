import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnerDetailHeader } from "@/app/(app)/partners/[id]/partner-detail-header";
import { BackLink } from "@/components/shared/back-link";
import { PartnerAmountsCard } from "@/app/(app)/partners/partner-amounts-card";
import { PartnerConfidentialNotesCard } from "@/app/(app)/partners/partner-confidential-notes-card";
import { PartnerInteractions } from "@/app/(app)/partners/partner-interactions";
import { PartnerFollowups } from "@/app/(app)/partners/partner-followups";
import { PartnerDocumentSends } from "@/app/(app)/partners/partner-document-sends";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/labels";
import { isEmailConfigured } from "@/lib/email/resend";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;
  const perms = currentUser.permissions;
  const hasAll = currentUser.profile.is_super_admin;
  const has = (module: Parameters<typeof can>[1], action: Parameters<typeof can>[2]) =>
    hasAll || can(perms, module, action);

  const supabase = await createClient();
  const { data: partner } = await supabase.from("partners").select("*").eq("id", id).single();
  if (!partner) notFound();

  const { data: event } = await supabase.from("events").select("currency").eq("id", eventId).single();
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, first_name, last_name")
    .eq("event_id", eventId)
    .order("first_name");
  const teamMemberList = teamMembers ?? [];
  const assignedTeamMemberName = partner.assigned_team_member_id
    ? (() => {
        const m = teamMemberList.find((tm) => tm.id === partner.assigned_team_member_id);
        return m ? `${m.first_name} ${m.last_name}` : null;
      })()
    : null;

  const canViewAmounts = has("partners", "view_amounts");
  const canViewConfidential = has("partners", "view_confidential_notes");
  const canViewHistory = has("partners", "view_history");
  const canViewFollowups = has("followups", "view");
  const canEditPartner = has("partners", "edit");
  const canEditFollowups = has("followups", "edit");

  const [
    { data: amounts },
    { data: confidentialNotes },
    { data: interactions },
    { data: followups },
    { data: contacts },
    { data: documentSends },
    { data: availableDocuments },
  ] = await Promise.all([
    canViewAmounts
      ? supabase.from("partner_amounts").select("*").eq("partner_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    canViewConfidential
      ? supabase.from("partner_confidential_notes").select("*").eq("partner_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    canViewHistory
      ? supabase.from("partner_interactions").select("*").eq("partner_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    canViewFollowups
      ? supabase.from("partner_followups").select("*").eq("partner_id", id).order("due_date", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from("partner_contacts").select("*").eq("partner_id", id),
    supabase.from("partner_document_sends").select("*").eq("partner_id", id).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").or(`partner_id.eq.${id},category.in.(contracts,conventions)`).eq("event_id", eventId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/partners" label="Retour aux partenaires" />
      <PartnerDetailHeader partner={partner} teamMembers={teamMemberList} />

      <Tabs defaultValue="info" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="followups">Relances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Secteur" value={partner.sector} />
                <Field label="Site internet" value={partner.website} />
                <Field label="Adresse" value={partner.address} className="col-span-2" />
                <Field label="Contact" value={partner.contact_name} />
                <Field label="Fonction" value={partner.contact_role} />
                <Field label="E-mail" value={partner.contact_email} />
                <Field label="Téléphone" value={partner.contact_phone} />
                <Field label="Source" value={partner.source} />
                <Field label="Responsable" value={assignedTeamMemberName} />
                <Field
                  label="Type de contribution"
                  value={partner.contribution_type ? CONTRIBUTION_TYPE_LABELS[partner.contribution_type] : null}
                />
                <Field label="Prochaine action" value={partner.next_action} className="col-span-2" />
                {partner.notes ? <Field label="Notes" value={partner.notes} className="col-span-2" /> : null}
                {partner.tags.length > 0 ? (
                  <div className="col-span-2 flex flex-wrap gap-1.5">
                    {partner.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {contacts && contacts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contacts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{contact.name}</span>
                        {contact.role ? <span className="text-muted-foreground"> — {contact.role}</span> : null}
                      </div>
                      <div className="text-muted-foreground">{contact.email ?? contact.phone}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <PartnerAmountsCard
              partnerId={id}
              amounts={amounts}
              canView={canViewAmounts}
              canEdit={canEditPartner}
              currency={event?.currency ?? "EUR"}
            />
            <PartnerConfidentialNotesCard
              partnerId={id}
              notes={confidentialNotes?.notes ?? null}
              canView={canViewConfidential}
              canEdit={canEditPartner}
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PartnerInteractions
            partnerId={id}
            interactions={interactions ?? []}
            canView={canViewHistory}
            canEdit={canEditPartner}
          />
        </TabsContent>

        <TabsContent value="followups">
          <PartnerFollowups
            partnerId={id}
            followups={followups ?? []}
            canView={canViewFollowups}
            canEdit={canEditFollowups}
          />
        </TabsContent>

        <TabsContent value="documents">
          <PartnerDocumentSends
            partnerId={id}
            sends={documentSends ?? []}
            availableDocuments={availableDocuments ?? []}
            canEdit={canEditPartner}
            emailConfigured={isEmailConfigured()}
            defaultRecipientEmail={partner.contact_email}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null;
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}
