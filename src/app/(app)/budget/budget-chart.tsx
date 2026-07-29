"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryTotal {
  name: string;
  forecast: number;
  actual: number;
}

export function BudgetChart({ data, currency }: { data: CategoryTotal[]; currency: string }) {
  const formatAmount = (value: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prévisionnel vs réel par catégorie</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tickFormatter={(v: number) => formatAmount(v)} width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatAmount(Number(value))} />
            <Bar dataKey="forecast" name="Prévisionnel" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Réel" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
