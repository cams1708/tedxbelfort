"use client";

import { useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleChecklistItemAction } from "@/app/(app)/speakers/actions";
import type { SpeakerChecklistKey } from "@/types/database.types";

const CHECKLIST_LABELS: Record<SpeakerChecklistKey, string> = {
  agreement_obtained: "Accord obtenu",
  contract_signed: "Contrat signé",
  image_rights_consent: "Autorisation de droit à l’image",
  bio_received: "Biographie reçue",
  hd_photo_received: "Photo HD reçue",
  title_received: "Titre reçu",
  summary_received: "Résumé reçu",
  talk_draft_received: "Première version du talk reçue",
  slides_received: "Slides reçues",
  slides_validated: "Slides validées",
  rehearsal_1_done: "Répétition 1 effectuée",
  rehearsal_2_done: "Répétition 2 effectuée",
  transport_booked: "Transport réservé",
  hotel_booked: "Hôtel réservé",
  technical_info_validated: "Informations techniques validées",
};

const ORDER = Object.keys(CHECKLIST_LABELS) as SpeakerChecklistKey[];

interface ChecklistItem {
  item_key: SpeakerChecklistKey;
  is_done: boolean;
}

export function SpeakerChecklist({
  speakerId,
  items,
  canEdit,
}: {
  speakerId: string;
  items: ChecklistItem[];
  canEdit: boolean;
}) {
  const doneByKey = new Map(items.map((i) => [i.item_key, i.is_done]));
  const [, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useOptimistic(
    doneByKey,
    (state, { key, value }: { key: SpeakerChecklistKey; value: boolean }) => new Map(state).set(key, value),
  );

  const doneCount = ORDER.filter((key) => optimisticDone.get(key)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Checklist ({doneCount}/{ORDER.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ORDER.map((key) => {
          const checked = optimisticDone.get(key) ?? false;
          return (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={checked}
                disabled={!canEdit}
                onCheckedChange={(value) => {
                  const next = value === true;
                  startTransition(() => {
                    setOptimisticDone({ key, value: next });
                    void toggleChecklistItemAction(speakerId, key, next);
                  });
                }}
              />
              <span className={checked ? "text-muted-foreground line-through" : undefined}>{CHECKLIST_LABELS[key]}</span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
