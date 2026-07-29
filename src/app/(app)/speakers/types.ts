import type { Tables } from "@/types/database.types";

export interface SpeakerRow extends Tables<"speakers"> {
  owner_name: string | null;
}
