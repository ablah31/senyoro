export const APP_ROLES = ["admin", "responsable"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function parseAppRole(value: string | null | undefined): AppRole {
  return value === "responsable" ? "responsable" : "admin";
}

export function isResponsableAllowedPath(pathname: string) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/washes" || pathname === "/washes/new") return true;
  if (/^\/washes\/[^/]+$/.test(pathname)) return true;
  if (/^\/washes\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}
