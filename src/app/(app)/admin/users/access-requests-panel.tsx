"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewAccessRequestAction } from "@/app/(app)/admin/users/actions";

interface AccessRequestRow {
  id: string;
  requester_name: string;
  permission_requested: string;
  reason: string | null;
  created_at: string;
}

export function AccessRequestsPanel({ requests }: { requests: AccessRequestRow[] }) {
  const [, startTransition] = useTransition();

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Demandes d’accès en attente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between gap-4 text-sm">
            <div>
              <div className="font-medium">
                {request.requester_name} — {request.permission_requested}
              </div>
              {request.reason ? <p className="text-muted-foreground">{request.reason}</p> : null}
              <span className="text-xs text-muted-foreground">
                {format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startTransition(() => void reviewAccessRequestAction(request.id, "approved_temporary", 30))}
              >
                Accès temporaire (30j)
              </Button>
              <Button size="sm" onClick={() => startTransition(() => void reviewAccessRequestAction(request.id, "approved"))}>
                Accorder
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => startTransition(() => void reviewAccessRequestAction(request.id, "denied"))}
              >
                Refuser
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
