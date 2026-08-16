import { getServices, getVehicleTypes } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogManager } from "@/components/services/catalog-manager";

export const metadata = { title: "Prestations" };

export default async function ServicesPage() {
  const [services, vehicleTypes] = await Promise.all([getServices(), getVehicleTypes()]);
  return (
    <div>
      <PageHeader title="Prestations" description="Prix par type de véhicule" />
      <CatalogManager services={services} vehicleTypes={vehicleTypes} />
    </div>
  );
}
