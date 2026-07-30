import type { Action, Module } from "@/lib/permissions/constants";
import {
  LayoutDashboard,
  Handshake,
  Mic2,
  Users,
  CheckSquare,
  Calendar,
  Wallet,
  Receipt,
  FolderClosed,
  BellRing,
  Settings,
  ShieldCheck,
  History,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  module: Module;
  action: Action;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, module: "dashboard", action: "view" },
  { href: "/partners", label: "Partenaires", icon: Handshake, module: "partners", action: "view" },
  { href: "/speakers", label: "Speakers", icon: Mic2, module: "speakers", action: "view" },
  { href: "/team", label: "Équipe", icon: Users, module: "team", action: "view" },
  { href: "/tasks", label: "Tâches", icon: CheckSquare, module: "tasks", action: "view" },
  { href: "/followups", label: "Relances", icon: BellRing, module: "followups", action: "view" },
  { href: "/calendar", label: "Calendrier", icon: Calendar, module: "calendar", action: "view" },
  { href: "/finance-summary", label: "Synthèse financière", icon: Wallet, module: "budget", action: "view" },
  { href: "/budget", label: "Budget", icon: Wallet, module: "budget", action: "view" },
  { href: "/invoices", label: "Factures", icon: Receipt, module: "invoices", action: "view" },
  { href: "/subsidies", label: "Subventions", icon: Landmark, module: "subsidies", action: "view" },
  { href: "/documents", label: "Documents", icon: FolderClosed, module: "documents", action: "view" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Utilisateurs et accès", icon: ShieldCheck, module: "users", action: "view" },
  { href: "/admin/activity-log", label: "Historique d’activité", icon: History, module: "activity_log", action: "view" },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, module: "settings", action: "view" },
];
