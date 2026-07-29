import { differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Handshake, Mic2, CheckSquare, BellRing, Receipt, Wallet, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/server";
import { resolveCurrentEventId } from "@/lib/events/current-event";
import { can } from "@/lib/permissions/types";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const eventId = await resolveCurrentEventId();
  if (!eventId) return null;

  const currentUser = await getCurrentUser(eventId);
  if (!currentUser) return null;

  const { permissions, profile } = currentUser;
  const hasAll = profile.is_super_admin;
  const canSee = (module: Parameters<typeof can>[1], action: Parameters<typeof can>[2] = "view") =>
    hasAll || can(permissions, module, action);

  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();

  const [partnersCount, speakersCount, overdueTasksCount, followupsCount, invoicesPendingCount] = await Promise.all([
    canSee("partners")
      ? supabase.from("partners").select("id", { count: "exact", head: true }).eq("event_id", eventId)
      : null,
    canSee("speakers")
      ? supabase.from("speakers").select("id", { count: "exact", head: true }).eq("event_id", eventId)
      : null,
    canSee("tasks")
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .lt("due_date", new Date().toISOString().slice(0, 10))
          .not("status", "in", "(done,cancelled)")
      : null,
    canSee("followups")
      ? supabase
          .from("partner_followups")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .in("status", ["upcoming", "due_today", "overdue"])
      : null,
    canSee("invoices")
      ? supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .in("status", ["to_send", "sent", "pending", "partially_paid", "overdue"])
      : null,
  ]);

  let sponsoringConfirmed: number | null = null;
  if (canSee("partners") && canSee("partners", "view_amounts")) {
    const { data: partnerIds } = await supabase.from("partners").select("id").eq("event_id", eventId);
    const ids = (partnerIds ?? []).map((p) => p.id);
    if (ids.length > 0) {
      const { data: amounts } = await supabase.from("partner_amounts").select("amount_confirmed").in("partner_id", ids);
      sponsoringConfirmed = (amounts ?? []).reduce((sum, a) => sum + (a.amount_confirmed ?? 0), 0);
    } else {
      sponsoringConfirmed = 0;
    }
  }

  let budgetRemaining: number | null = null;
  if (canSee("budget")) {
    const { data: transactions } = await supabase
      .from("financial_transactions")
      .select("type, amount_ttc")
      .eq("event_id", eventId);
    const revenue = (transactions ?? []).filter((t) => t.type === "revenue").reduce((s, t) => s + Number(t.amount_ttc), 0);
    const expense = (transactions ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount_ttc), 0);
    budgetRemaining = revenue - expense;
  }

  let upcomingCalendarItems: { id: string; title: string; start_at: string; type: string }[] = [];
  if (canSee("calendar")) {
    const { data } = await supabase
      .from("calendar_items")
      .select("id, title, start_at, type")
      .eq("event_id", eventId)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5);
    upcomingCalendarItems = data ?? [];
  }

  const daysUntilEvent = event?.event_date ? differenceInCalendarDays(new Date(event.event_date), new Date()) : null;
  const currency = event?.currency ?? "EUR";
  const formatAmount = (value: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          {event?.name} — {event?.theme}
          {daysUntilEvent !== null ? (
            <span>
              {" · "}
              {daysUntilEvent >= 0 ? `J-${daysUntilEvent}` : "Événement passé"}
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {partnersCount ? (
          <StatCard label="Partenaires" value={String(partnersCount.count ?? 0)} icon={Handshake} />
        ) : null}
        {sponsoringConfirmed !== null ? (
          <StatCard
            label="Sponsoring confirmé"
            value={formatAmount(sponsoringConfirmed)}
            hint={event?.sponsoring_goal ? `Objectif : ${formatAmount(Number(event.sponsoring_goal))}` : undefined}
            icon={Wallet}
          />
        ) : null}
        {speakersCount ? <StatCard label="Speakers" value={String(speakersCount.count ?? 0)} icon={Mic2} /> : null}
        {overdueTasksCount ? (
          <StatCard
            label="Tâches en retard"
            value={String(overdueTasksCount.count ?? 0)}
            icon={CheckSquare}
            tone={(overdueTasksCount.count ?? 0) > 0 ? "danger" : "default"}
          />
        ) : null}
        {followupsCount ? (
          <StatCard
            label="Relances à effectuer"
            value={String(followupsCount.count ?? 0)}
            icon={BellRing}
            tone={(followupsCount.count ?? 0) > 0 ? "warning" : "default"}
          />
        ) : null}
        {invoicesPendingCount ? (
          <StatCard label="Factures en attente" value={String(invoicesPendingCount.count ?? 0)} icon={Receipt} />
        ) : null}
        {budgetRemaining !== null ? (
          <StatCard
            label="Budget restant"
            value={formatAmount(budgetRemaining)}
            hint={event?.budget_forecast ? `Prévisionnel : ${formatAmount(Number(event.budget_forecast))}` : undefined}
            icon={Wallet}
          />
        ) : null}
      </div>

      {canSee("calendar") ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Prochaines échéances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingCalendarItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune échéance à venir.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcomingCalendarItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(item.start_at), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
