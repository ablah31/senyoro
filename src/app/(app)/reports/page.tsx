import { getCashDay, getDashboardKpis, getEmployees, getExpenseCategories, getNamedSeries, getOrganization, getServices, getVehicleTypes, periodFromSearch, washIdsForFilter } from "@/lib/queries";
import { requireClient } from "@/lib/auth";
import { toIsoDate } from "@/lib/dates";
import { formatGNF, toAmount } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelector } from "@/components/shared/period-selector";
import { ListFilters } from "@/components/shared/list-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toSearchString } from "@/lib/search-params";

export const metadata = { title: "Rapports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    employeeId?: string;
    serviceId?: string;
    vehicleTypeId?: string;
    paymentMethod?: string;
    categoryId?: string;
    nature?: string;
  }>;
}) {
  const params = await searchParams;
  const range = periodFromSearch(params);
  const from = toIsoDate(range.from);
  const to = toIsoDate(range.to);
  const [categories, vehicleTypes, services, employees, supabase, filteredIds, org] = await Promise.all([
    getExpenseCategories(),
    getVehicleTypes(),
    getServices(),
    getEmployees(),
    requireClient(),
    washIdsForFilter({ employeeId: params.employeeId, serviceId: params.serviceId }),
    getOrganization(),
  ]);

  const hasWashFilter = Boolean(
    params.employeeId || params.serviceId || params.vehicleTypeId || params.paymentMethod,
  );

  let kpis = await getDashboardKpis(range.from, range.to);
  let byService = await getNamedSeries("revenue_by_service", range.from, range.to);

  if (hasWashFilter) {
    if (filteredIds && filteredIds.length === 0) {
      kpis = { ...kpis, revenue: 0, washCount: 0, avgTicket: 0, cashCollected: 0, mobileCollected: 0, profit: -kpis.expenses };
      byService = [];
    } else {
      let washQuery = supabase
        .from("washes")
        .select("final_amount, payment_method, wash_services(name)")
        .eq("status", "active")
        .gte("business_date", from)
        .lte("business_date", to);
      if (filteredIds) washQuery = washQuery.in("id", filteredIds);
      if (params.vehicleTypeId) washQuery = washQuery.eq("vehicle_type_id", params.vehicleTypeId);
      if (params.paymentMethod === "cash" || params.paymentMethod === "mobile_money") {
        washQuery = washQuery.eq("payment_method", params.paymentMethod);
      }
      const { data: washes } = await washQuery;
      const rows = washes ?? [];
      const revenue = rows.reduce((sum, row) => sum + toAmount(row.final_amount), 0);
      const cashCollected = rows
        .filter((row) => row.payment_method === "cash")
        .reduce((sum, row) => sum + toAmount(row.final_amount), 0);
      const mobileCollected = rows
        .filter((row) => row.payment_method === "mobile_money")
        .reduce((sum, row) => sum + toAmount(row.final_amount), 0);
      kpis = {
        ...kpis,
        revenue,
        washCount: rows.length,
        avgTicket: rows.length ? Math.trunc(revenue / rows.length) : 0,
        cashCollected,
        mobileCollected,
        profit: revenue - kpis.expenses,
      };
      const serviceMap = new Map<string, number>();
      for (const row of rows) {
        const names = (row.wash_services as { name: string }[] | null) ?? [];
        for (const service of names) {
          serviceMap.set(service.name, (serviceMap.get(service.name) ?? 0) + toAmount(row.final_amount));
        }
      }
      byService = [...serviceMap.entries()].map(([name, value]) => ({ name, value }));
    }
  }

  let expenseQuery = supabase
    .from("expenses")
    .select("amount, nature, category_id")
    .eq("status", "active")
    .gte("date", from)
    .lte("date", to);
  if (params.categoryId) expenseQuery = expenseQuery.eq("category_id", params.categoryId);
  if (params.nature === "FIXE" || params.nature === "VARIABLE") {
    expenseQuery = expenseQuery.eq("nature", params.nature);
  }
  const { data: expenseRows } = await expenseQuery;
  const expenses = expenseRows ?? [];
  const expenseTotal = expenses.reduce((sum, row) => sum + toAmount(row.amount), 0);
  const fixed = expenses
    .filter((row) => row.nature === "FIXE")
    .reduce((sum, row) => sum + toAmount(row.amount), 0);
  const variable = expenses
    .filter((row) => row.nature === "VARIABLE")
    .reduce((sum, row) => sum + toAmount(row.amount), 0);
  kpis = { ...kpis, expenses: expenseTotal, profit: kpis.revenue - expenseTotal };

  const { count: activeEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const singleDay = from === to;
  const cash = org.cash_enabled && singleDay ? await getCashDay(from) : null;

  const qs = toSearchString({
    from,
    to,
    employeeId: params.employeeId,
    serviceId: params.serviceId,
    vehicleTypeId: params.vehicleTypeId,
    paymentMethod: params.paymentMethod,
    categoryId: params.categoryId,
    nature: params.nature,
  }).replace(/^\?/, "");

  return (
    <div className="space-y-6">
      <PageHeader title="Rapports" description="Périodes, filtres et exports CSV / Excel" />
      <PeriodSelector />
      <ListFilters
        vehicleTypes={vehicleTypes.map((item) => ({ id: item.id, name: item.name }))}
        services={services.map((item) => ({ id: item.id, name: item.name }))}
        employees={employees.map((item) => ({
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
        }))}
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        showPayment
        showNature
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Véhicules" value={String(kpis.washCount)} />
        <Stat title="CA" value={formatGNF(kpis.revenue)} />
        <Stat title="Espèces" value={formatGNF(kpis.cashCollected)} />
        <Stat title="Mobile Money" value={formatGNF(kpis.mobileCollected)} />
        <Stat title="Dépenses" value={formatGNF(kpis.expenses)} />
        <Stat title="Charges fixes" value={formatGNF(fixed)} />
        <Stat title="Charges variables" value={formatGNF(variable)} />
        <Stat title="Bénéfice estimé" value={formatGNF(kpis.profit)} />
        <Stat title="Employés actifs" value={String(activeEmployees ?? 0)} />
      </div>
      {cash ? (
        <Card>
          <CardHeader>
            <CardTitle>Caisse du jour</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>Espèces théoriques : <span className="tabular-amount">{formatGNF(cash.theoretical_cash)}</span></p>
            <p>Mobile Money théorique : <span className="tabular-amount">{formatGNF(cash.theoretical_mobile)}</span></p>
            <p>{cash.closed_at ? "Caisse clôturée" : "Caisse non clôturée"}</p>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Prestations réalisées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {byService.map((row) => (
            <div key={row.name} className="flex justify-between text-sm">
              <span>{row.name}</span>
              <span className="tabular-amount">{formatGNF(row.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {["washes", "expenses", "salaries", "employees", "finance"].map((resource) => (
          <div key={resource} className="flex gap-2">
            <Button variant="outline" render={<a href={`/api/export/${resource}?${qs}&format=csv`} />}>
              {resource} CSV
            </Button>
            <Button variant="outline" render={<a href={`/api/export/${resource}?${qs}&format=xlsx`} />}>
              {resource} Excel
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Résultat de gestion interne, non certifié comptablement.</p>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-lg font-semibold">{value}</CardContent>
    </Card>
  );
}
