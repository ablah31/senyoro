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
  Wallet,
  UserRound,
} from "lucide-react";

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
  { href: "/cash", label: "Caisse", icon: Wallet },
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
  { href: "/cash", label: "Caisse", icon: Wallet },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
];

export function getNavItems(cashEnabled: boolean) {
  if (cashEnabled) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.href !== "/cash");
}

export function getMobilePrimary(cashEnabled: boolean) {
  if (cashEnabled) return MOBILE_PRIMARY;
  return MOBILE_PRIMARY.map((item) =>
    item.href === "/cash" ? { href: "/customers", label: "Clients", icon: UserRound } : item,
  );
}
