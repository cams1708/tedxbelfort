import type { Tables } from "@/types/database.types";

export interface TeamMemberOption {
  id: string;
  first_name: string;
  last_name: string;
}

export interface PartnerRow extends Tables<"partners"> {
  owner_name: string | null;
  assigned_team_member_name: string | null;
  amount_confirmed: number | null;
  amount_expected: number | null;
}
