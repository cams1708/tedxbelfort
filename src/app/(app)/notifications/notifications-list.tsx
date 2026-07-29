"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/(app)/notifications/actions";
import type { Tables } from "@/types/database.types";

export function NotificationsList({ notifications }: { notifications: Tables<"notifications">[] }) {
  const [, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex flex-col gap-4">
      {hasUnread ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTransition(() => void markAllNotificationsReadAction())}
          >
            Tout marquer comme lu
          </Button>
        </div>
      ) : null}
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune notification.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.is_read ? "opacity-60" : undefined}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <Link
                    href={notification.link_url ?? "#"}
                    className="font-medium hover:underline"
                    onClick={() => {
                      if (!notification.is_read) {
                        startTransition(() => void markNotificationReadAction(notification.id));
                      }
                    }}
                  >
                    {notification.title}
                  </Link>
                  {notification.body ? <p className="text-sm text-muted-foreground">{notification.body}</p> : null}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </span>
                </div>
                {!notification.is_read ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startTransition(() => void markNotificationReadAction(notification.id))}
                  >
                    Marquer comme lu
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
