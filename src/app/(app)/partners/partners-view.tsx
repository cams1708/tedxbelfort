"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnersTable } from "@/app/(app)/partners/partners-table";
import { PartnersKanban } from "@/app/(app)/partners/partners-kanban";
import { PartnerFormDialog } from "@/app/(app)/partners/partner-form-dialog";
import { Can } from "@/lib/permissions/context";
import type { PartnerRow, TeamMemberOption } from "@/app/(app)/partners/types";

export function PartnersView({
  partners,
  currency,
  teamMembers,
}: {
  partners: PartnerRow[];
  currency: string;
  teamMembers: TeamMemberOption[];
}) {
  const [view, setView] = useState("table");

  return (
    <Tabs value={view} onValueChange={(v) => typeof v === "string" && setView(v)} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="table">Tableau</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <Can module="partners" action="create">
          <PartnerFormDialog teamMembers={teamMembers} />
        </Can>
      </div>

      <TabsContent value="table">
        <PartnersTable partners={partners} currency={currency} />
      </TabsContent>
      <TabsContent value="kanban">
        <PartnersKanban partners={partners} />
      </TabsContent>
    </Tabs>
  );
}
