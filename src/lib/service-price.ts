import { toAmount } from "@/lib/format";

export function priceForVehicle(
  service:
    | {
        reference_price?: number | string | null;
        service_prices: { vehicle_type_id: string; price: number | string }[];
      }
    | undefined,
  vehicleTypeId: string,
): number {
  if (!service) return 0;
  const row = service.service_prices.find((item) => item.vehicle_type_id === vehicleTypeId);
  if (row) return toAmount(row.price);
  return toAmount(service.reference_price);
}
