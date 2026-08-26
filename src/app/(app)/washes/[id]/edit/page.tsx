import { notFound, redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { getCustomersForLookup, getEmployees, getServices, getVehicleTypes } from "@/lib/queries";
import { toAmount } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { WashForm } from "@/components/washes/wash-form";

export const metadata = { title: "Modifier le lavage" };

export default async function EditWashPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await requireClient();
  const [vehicleTypes, services, employees, customers, washResult] = await Promise.all([
    getVehicleTypes(),
    getServices(),
    getEmployees(),
    getCustomersForLookup(),
    supabase.from("washes").select("*, wash_services(service_id), wash_employees(employee_id)").eq("id", id).maybeSingle(),
  ]);
  const wash = washResult.data;

  if (!wash) notFound();
  if (wash.status !== "active") redirect(`/washes/${id}`);

  const serviceIds = (wash.wash_services ?? [])
    .map((row) => row.service_id)
    .filter((serviceId): serviceId is string => Boolean(serviceId));
  const employeeIds = (wash.wash_employees ?? []).map((row) => row.employee_id);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Modifier le lavage" description="Corrigez la saisie puis enregistrez" />
      <WashForm
        vehicleTypes={vehicleTypes}
        services={services}
        employees={employees}
        customers={customers}
        wash={{
          id: wash.id,
          vehicleTypeId: wash.vehicle_type_id ?? vehicleTypes[0]?.id ?? "",
          plate: wash.plate ?? "",
          serviceIds,
          employeeIds,
          paymentMethod: wash.payment_method,
          finalAmount: toAmount(wash.final_amount),
          discountReason: wash.discount_reason,
          customerId: wash.customer_id,
          customerName: wash.customer_name,
          customerPhone: wash.customer_phone,
          note: wash.note,
          occurredAt: wash.occurred_at,
        }}
      />
    </div>
  );
}
