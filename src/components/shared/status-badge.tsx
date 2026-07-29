import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/labels";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  danger: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent font-medium", TONE_CLASSES[tone])}>
      {label}
    </Badge>
  );
}
