import { getServices, getVehicleTypes } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogManager } from "@/components/services/catalog-manager";

export const metadata = { title: "Prestations" };

export default async function ServicesPage() {
  const [services, vehicleTypes] = await Promise.all([getServices(), getVehicleTypes()]);
  return (
    <div>
      <PageHeader
        title="Prestations"
        description="Touchez un prix pour le changer. C'est enregistré tout seul."
      />
      <CatalogManager services={services} vehicleTypes={vehicleTypes} />
    </div>
  );
}
