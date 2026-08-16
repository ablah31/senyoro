import { requireClient } from "@/lib/auth";
import { getExpenseCategories, getOrganization, getServices, getVehicleTypes } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForms } from "@/components/settings/settings-forms";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const [org, categories, vehicleTypes, services, supabase] = await Promise.all([
    getOrganization(),
    getExpenseCategories(),
    getVehicleTypes(),
    getServices(),
    requireClient(),
  ]);
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div>
      <PageHeader title="Paramètres" description="Centre, catalogue et journal d'activité" />
      <SettingsForms
        organization={org}
        categories={categories}
        vehicleTypes={vehicleTypes}
        serviceCount={services.length}
        logs={logs ?? []}
      />
    </div>
  );
}
