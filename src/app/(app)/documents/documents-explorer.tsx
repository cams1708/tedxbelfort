"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentsTable } from "@/app/(app)/documents/documents-table";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { Folder, ArrowLeft } from "lucide-react";
import type { Tables } from "@/types/database.types";

export function DocumentsExplorer({ documents }: { documents: Tables<"documents">[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Tables<"documents">[]>();
    for (const doc of documents) {
      const list = map.get(doc.category) ?? [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return map;
  }, [documents]);

  if (documents.length === 0) {
    return <DocumentsTable documents={[]} />;
  }

  if (selectedCategory) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSelectedCategory(null)}>
          <ArrowLeft className="size-3.5" /> Retour aux dossiers
        </Button>
        <h2 className="text-lg font-semibold">{DOCUMENT_CATEGORY_LABELS[selectedCategory] ?? selectedCategory}</h2>
        <DocumentsTable documents={grouped.get(selectedCategory) ?? []} />
      </div>
    );
  }

  const categories = Array.from(grouped.keys()).sort((a, b) =>
    (DOCUMENT_CATEGORY_LABELS[a] ?? a).localeCompare(DOCUMENT_CATEGORY_LABELS[b] ?? b),
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const docs = grouped.get(category) ?? [];
        return (
          <button key={category} type="button" onClick={() => setSelectedCategory(category)} className="text-left">
            <Card className="transition-colors hover:border-foreground/40">
              <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                <Folder className="size-8 text-muted-foreground" />
                <span className="font-medium">{DOCUMENT_CATEGORY_LABELS[category] ?? category}</span>
                <span className="text-xs text-muted-foreground">
                  {docs.length} document{docs.length > 1 ? "s" : ""}
                </span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
