import Link from "next/link";
import {
  getDashboardKpis,
  getEmployeeRanking,
  getNamedSeries,
  getRevenueByEmployee,
  getTimeseries,
  periodFromSearch,
} from "@/lib/queries";
import { requireClient } from "@/lib/auth";
import { monthStart, toIsoDate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelector } from "@/components/shared/period-selector";
import { KpiCard } from "@/components/shared/kpi-card";
import { BarMetricChart, LineMetricChart, PieMetricChart } from "@/components/dashboard/charts";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = periodFromSearch(params);
  const [
    current,
    previous,
    revenueTs,
    expenseTs,
    profitTs,
    washTs,
    byService,
    byVehicle,
    byCategory,
    byPayment,
    byEmployee,
    ranking,
  ] = await Promise.all([
    getDashboardKpis(range.from, range.to),
    getDashboardKpis(range.previousFrom, range.previousTo),
    getTimeseries(range.from, range.to, "revenue"),
    getTimeseries(range.from, range.to, "expenses"),
    getTimeseries(range.from, range.to, "profit"),
    getTimeseries(range.from, range.to, "washes"),
    getNamedSeries("revenue_by_service", range.from, range.to),
    getNamedSeries("revenue_by_vehicle_type", range.from, range.to),
    getNamedSeries("expenses_by_category", range.from, range.to),
    getNamedSeries("payment_split", range.from, range.to),
    getRevenueByEmployee(range.from, range.to),
    getEmployeeRanking(range.from, range.to),
  ]);

  const supabase = await requireClient();
  const month = monthStart();
  const { data: goal } = await supabase.from("financial_goals").select("*").eq("period_month", month).maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description={range.label}>
        <Button className="h-11" nativeButton={false} render={<Link href="/washes/new" />}>
          Nouveau lavage
        </Button>
      </PageHeader>
      <PeriodSelector />
      <p className="text-xs text-muted-foreground">
        Bénéfice = CA encaissé − dépenses validées. Résultat de gestion interne, non comptable certifié.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Chiffre d'affaires" value={current.revenue} previous={previous.revenue} />
        <KpiCard label="Bénéfice estimé" value={current.profit} previous={previous.profit} />
        <KpiCard label="Dépenses" value={current.expenses} previous={previous.expenses} />
        <KpiCard label="Véhicules lavés" value={current.washCount} previous={previous.washCount} isAmount={false} />
        <KpiCard label="Panier moyen" value={current.avgTicket} previous={previous.avgTicket} />
        <KpiCard label="Espèces" value={current.cashCollected} previous={previous.cashCollected} />
        <KpiCard label="Mobile Money" value={current.mobileCollected} previous={previous.mobileCollected} />
      </div>
      <GoalsCard
        periodMonth={month}
        revenueTarget={goal?.revenue_target ?? 0}
        washesTarget={goal?.washes_target ?? 0}
        revenue={current.revenue}
        washes={current.washCount}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <LineMetricChart title="Évolution du chiffre d'affaires" data={revenueTs} />
        <LineMetricChart title="Évolution des dépenses" data={expenseTs} />
        <LineMetricChart title="Évolution du bénéfice" data={profitTs} />
        <LineMetricChart title="Nombre de lavages" data={washTs} />
        <BarMetricChart title="CA par prestation" data={byService} />
        <BarMetricChart title="CA par type de véhicule" data={byVehicle} />
        <BarMetricChart title="Dépenses par catégorie" data={byCategory} />
        <PieMetricChart title="Espèces / Mobile Money" data={byPayment} />
        <BarMetricChart
          title="CA par employé"
          data={byEmployee.map((row) => ({ name: row.name, value: row.value }))}
        />
      </div>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="mb-3 font-semibold">Classement des employés</p>
        <ol className="space-y-2">
          {ranking
            .filter((row) => row.wash_count > 0)
            .map((row, index) => (
              <li key={row.employee_id} className="flex justify-between text-sm">
                <Link href={`/employees/${row.employee_id}`} className="hover:underline">
                  {index + 1}. {row.name}
                </Link>
                <span>{row.wash_count} lavages</span>
              </li>
            ))}
        </ol>
      </div>
      <p className="text-xs text-muted-foreground">Période du {toIsoDate(range.from)} au {toIsoDate(range.to)}</p>
    </div>
  );
}
