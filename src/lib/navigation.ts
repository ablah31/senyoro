import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BarChart3,
  CircleHelp,
  Droplets,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Settings,
  Users,
  UserRound,
} from "lucide-react";
import type { AppRole } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/washes/new", label: "Nouveau lavage", icon: PlusCircle, match: "exact" },
  { href: "/washes", label: "Lavages", icon: Droplets, match: "exact" },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
  { href: "/employees", label: "Employés", icon: Users },
  { href: "/salaries", label: "Salaires", icon: Banknote },
  { href: "/customers", label: "Clients", icon: UserRound },
  { href: "/services", label: "Prestations", icon: Droplets },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/settings", label: "Paramètres", icon: Settings },
  { href: "/help", label: "Aide", icon: CircleHelp },
];

export const MOBILE_PRIMARY: NavItem[] = [
  { href: "/washes/new", label: "Lavage", icon: PlusCircle, match: "exact" },
  { href: "/dashboard", label: "Synthèse", icon: LayoutDashboard },
  { href: "/customers", label: "Clients", icon: UserRound },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
];

const RESPONSABLE_HREFS = new Set(["/dashboard", "/washes/new", "/washes"]);

export const RESPONSABLE_MOBILE: NavItem[] = [
  { href: "/washes/new", label: "Lavage", icon: PlusCircle, match: "exact" },
  { href: "/dashboard", label: "Synthèse", icon: LayoutDashboard },
  { href: "/washes", label: "Lavages", icon: Droplets, match: "exact" },
];

export function getNavItems(role: AppRole) {
  if (role !== "responsable") return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => RESPONSABLE_HREFS.has(item.href));
}

export function getMobilePrimary(role: AppRole) {
  if (role !== "responsable") return MOBILE_PRIMARY;
  return RESPONSABLE_MOBILE;
}
