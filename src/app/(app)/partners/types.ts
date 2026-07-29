import type { Tables } from "@/types/database.types";

export interface PartnerRow extends Tables<"partners"> {
  owner_name: string | null;
  amount_confirmed: number | null;
  amount_expected: number | null;
}
