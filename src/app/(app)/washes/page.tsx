import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getEmployees, getServices, getVehicleTypes, periodFromSearch, washIdsForFilter } from "@/lib/queries";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatDateTime, toIsoDate } from "@/lib/dates";
import { formatGNF } from "@/lib/format";
import { toSearchString } from "@/lib/search-params";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PeriodSelector } from "@/components/shared/period-selector";
import { ListFilters } from "@/components/shared/list-filters";
import { QuerySearch } from "@/components/shared/query-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Lavages" };

export default async function WashesPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
    employeeId?: string;
    serviceId?: string;
    vehicleTypeId?: string;
    paymentMethod?: string;
  }>;
}) {
  const params = await searchParams;
  const range = periodFromSearch(params);
  const rawQuery = params.q ?? "";
  const q = rawQuery.replace(/[%(),]/g, "").trim();
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const supabase = await requireClient();
  const [vehicleTypes, services, employees, filteredIds] = await Promise.all([
    getVehicleTypes(),
    getServices(),
    getEmployees(),
    washIdsForFilter({ employeeId: params.employeeId, serviceId: params.serviceId }),
  ]);

  const queryValues = {
    period: params.period,
    from: params.from,
    to: params.to,
    q,
    employeeId: params.employeeId,
    serviceId: params.serviceId,
    vehicleTypeId: params.vehicleTypeId,
    paymentMethod: params.paymentMethod,
  };

  let count = 0;
  let data: {
    id: string;
    occurred_at: string;
    plate: string | null;
    final_amount: number;
    payment_method: "cash" | "mobile_money";
    status: string;
    customer_name: string | null;
    vehicle_types: { name: string } | null;
    wash_services: { name: string }[] | null;
    wash_employees: { employees: { first_name: string; last_name: string } | null }[] | null;
  }[] = [];

  if (filteredIds && filteredIds.length === 0) {
    data = [];
  } else {
    let query = supabase
      .from("washes")
      .select(
        "id, occurred_at, plate, final_amount, payment_method, status, customer_name, vehicle_types(name), wash_services(name), wash_employees(employees(first_name, last_name))",
        { count: "exact" },
      )
      .gte("business_date", toIsoDate(range.from))
      .lte("business_date", toIsoDate(range.to))
      .order("occurred_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filteredIds) query = query.in("id", filteredIds);
    if (params.vehicleTypeId) query = query.eq("vehicle_type_id", params.vehicleTypeId);
    if (params.paymentMethod === "cash" || params.paymentMethod === "mobile_money") {
      query = query.eq("payment_method", params.paymentMethod);
    }
    if (q) {
      query = query.or(`plate.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
    }

    const result = await query;
    data = (result.data ?? []) as typeof data;
    count = result.count ?? 0;
  }

  return (
    <div>
      <PageHeader title="Lavages" description="Historique filtrable des transactions">
        <Button className="h-11" render={<Link href="/washes/new" />}>
          Nouveau lavage
        </Button>
      </PageHeader>
      <div className="mb-4 space-y-3">
        <PeriodSelector />
        <QuerySearch placeholder="Plaque, client, téléphone" />
        <ListFilters
          vehicleTypes={vehicleTypes.map((item) => ({ id: item.id, name: item.name }))}
          services={services.map((item) => ({ id: item.id, name: item.name }))}
          employees={employees.map((item) => ({
            id: item.id,
            name: `${item.first_name} ${item.last_name}`,
          }))}
          showPayment
        />
      </div>
      {data.length === 0 ? (
        <EmptyState
          title="Aucun lavage enregistré sur cette période."
          actionLabel="Enregistrer le premier lavage"
          actionHref="/washes/new"
        />
      ) : (
        <div className="space-y-3">
          {data.map((wash) => {
            const vehicle = wash.vehicle_types;
            const servicesForWash = wash.wash_services ?? [];
            const employeesForWash = wash.wash_employees ?? [];
            return (
              <Link
                key={wash.id}
                href={`/washes/${wash.id}`}
                className="block min-w-0 overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{wash.plate ?? "Sans plaque"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {formatDateTime(wash.occurred_at)} · {vehicle?.name}
                    </p>
                    <p className="mt-1 truncate text-sm">{servicesForWash.map((s) => s.name).join(", ")}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {employeesForWash
                        .map((row) =>
                          row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : "",
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-amount font-semibold">{formatGNF(wash.final_amount)}</p>
                    <Badge variant={wash.status === "active" ? "secondary" : "destructive"}>
                      {wash.status === "active" ? PAYMENT_LABELS[wash.payment_method] : "Annulé"}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
          {count > pageSize ? (
            <div className="flex justify-center gap-2 pt-2">
              {page > 1 ? (
                <Button
                  variant="outline"
                  render={<Link href={toSearchString(queryValues, { page: page - 1 })} />}
                >
                  Précédent
                </Button>
              ) : null}
              {page * pageSize < count ? (
                <Button
                  variant="outline"
                  render={<Link href={toSearchString(queryValues, { page: page + 1 })} />}
                >
                  Suivant
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
