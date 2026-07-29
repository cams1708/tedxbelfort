import type { Tables } from "@/types/database.types";

export interface TaskRow extends Tables<"tasks"> {
  owner_name: string | null;
  is_assignee: boolean;
}
