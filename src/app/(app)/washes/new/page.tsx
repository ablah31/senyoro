import { getEmployees, getServices, getVehicleTypes } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { WashForm } from "@/components/washes/wash-form";

export const metadata = { title: "Nouveau lavage" };

export default async function NewWashPage() {
  const [vehicleTypes, services, employees] = await Promise.all([
    getVehicleTypes(),
    getServices(),
    getEmployees(true),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nouveau lavage" description="Saisie en moins de 30 secondes" />
      <WashForm vehicleTypes={vehicleTypes} services={services} employees={employees} />
    </div>
  );
}
