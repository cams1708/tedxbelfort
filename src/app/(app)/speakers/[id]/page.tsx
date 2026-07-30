import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { getCurrentUser } from "@/lib/permissions/server";
import { can } from "@/lib/permissions/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeakerDetailHeader } from "@/app/(app)/speakers/[id]/speaker-detail-header";
import { BackLink } from "@/components/shared/back-link";
import { SpeakerPrivateCard } from "@/app/(app)/speakers/speaker-private-card";
import { SpeakerChecklist } from "@/app/(app)/speakers/speaker-checklist";
import { SpeakerTimeline } from "@/app/(app)/speakers/speaker-timeline";

export default async function SpeakerDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const { data: speaker } = await supabase.from("speakers").select("*").eq("id", id).single();
  if (!speaker) notFound();

  const canViewPersonal = has("speakers", "view_personal_info");
  const canViewHistory = has("speakers", "view_history");
  const canEditSpeaker = has("speakers", "edit");

  const [{ data: privateData }, { data: checklist }, { data: timeline }] = await Promise.all([
    canViewPersonal
      ? supabase.from("speaker_private").select("*").eq("speaker_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("speaker_checklist_items").select("item_key, is_done").eq("speaker_id", id),
    canViewHistory
      ? supabase.from("speaker_timeline").select("*").eq("speaker_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/speakers" label="Retour aux speakers" />
      <SpeakerDetailHeader speaker={speaker} />

      <Tabs defaultValue="info" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Suivi</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profil</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Ville" value={speaker.city} />
                <Field label="Profession" value={speaker.profession} />
                <Field label="Entreprise" value={speaker.company} className="col-span-2" />
                {speaker.bio ? <Field label="Biographie" value={speaker.bio} className="col-span-2" /> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Talk</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Sujet proposé" value={speaker.proposed_topic} className="col-span-2" />
                <Field label="Titre" value={speaker.talk_title} className="col-span-2" />
                {speaker.talk_summary ? <Field label="Résumé" value={speaker.talk_summary} className="col-span-2" /> : null}
                <Field label="Angle" value={speaker.talk_angle} />
                <Field label="Durée" value={speaker.duration_minutes ? `${speaker.duration_minutes} min` : null} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Logistique</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Disponibilités" value={speaker.availability} />
                <Field label="Contraintes" value={speaker.constraints} />
                <Field label="Besoins techniques" value={speaker.technical_needs} />
                <Field label="Accessibilité" value={speaker.accessibility_needs} />
                <Field label="Transport" value={speaker.transport} />
                <Field label="Hébergement" value={speaker.accommodation} />
                {speaker.notes ? <Field label="Notes internes" value={speaker.notes} className="col-span-2" /> : null}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <SpeakerPrivateCard speakerId={id} data={privateData} canView={canViewPersonal} canEdit={canEditSpeaker} />
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <SpeakerChecklist speakerId={id} items={checklist ?? []} canEdit={canEditSpeaker} />
        </TabsContent>

        <TabsContent value="timeline">
          <SpeakerTimeline
            speakerId={id}
            entries={timeline ?? []}
            canView={canViewHistory}
            canEdit={canEditSpeaker}
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
