import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActionContext } from "@/lib/auth";
import { getOrganization } from "@/lib/queries";
import { isResponsableAllowedPath } from "@/lib/roles";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ role }, org, headerList] = await Promise.all([
    requireActionContext(),
    getOrganization(),
    headers(),
  ]);
  const pathname = headerList.get("x-pathname") ?? "";
  if (role === "responsable" && pathname && !isResponsableAllowedPath(pathname)) {
    redirect("/dashboard");
  }
  return (
    <AppShell orgName={org.name} role={role}>
      {children}
    </AppShell>
  );
}
