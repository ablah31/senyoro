import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const org = await getOrganization();
  return (
    <AppShell orgName={org.name} cashEnabled={org.cash_enabled}>
      {children}
    </AppShell>
  );
}
