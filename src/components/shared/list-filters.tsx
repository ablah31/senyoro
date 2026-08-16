"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAYMENT_LABELS, NATURE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string };

export function ListFilters({
  employees,
  services,
  vehicleTypes,
  categories,
  showPayment = false,
  showNature = false,
}: {
  employees?: Option[];
  services?: Option[];
  vehicleTypes?: Option[];
  categories?: Option[];
  showPayment?: boolean;
  showNature?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <form
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const search = new URLSearchParams(params.toString());
        for (const key of ["vehicleTypeId", "serviceId", "employeeId", "paymentMethod", "categoryId", "nature"]) {
          const value = String(form.get(key) ?? "");
          if (value) search.set(key, value);
          else search.delete(key);
        }
        search.delete("page");
        const query = search.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      {vehicleTypes ? (
        <select
          name="vehicleTypeId"
          defaultValue={params.get("vehicleTypeId") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Type de véhicule"
        >
          <option value="">Tous les véhicules</option>
          {vehicleTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      {services ? (
        <select
          name="serviceId"
          defaultValue={params.get("serviceId") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Prestation"
        >
          <option value="">Toutes les prestations</option>
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      {employees ? (
        <select
          name="employeeId"
          defaultValue={params.get("employeeId") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Employé"
        >
          <option value="">Tous les employés</option>
          {employees.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      {showPayment ? (
        <select
          name="paymentMethod"
          defaultValue={params.get("paymentMethod") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Moyen de paiement"
        >
          <option value="">Tous les paiements</option>
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ) : null}
      {categories ? (
        <select
          name="categoryId"
          defaultValue={params.get("categoryId") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Catégorie de dépense"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      {showNature ? (
        <select
          name="nature"
          defaultValue={params.get("nature") ?? ""}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm"
          aria-label="Nature de charge"
        >
          <option value="">Fixes et variables</option>
          {Object.entries(NATURE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ) : null}
      <Button type="submit" variant="outline" className="h-11">
        Filtrer
      </Button>
    </form>
  );
}
