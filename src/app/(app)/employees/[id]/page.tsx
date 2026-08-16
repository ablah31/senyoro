import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { getEmployeeMonthlyActivity, getEmployeeRanking, getEmployeeRoles } from "@/lib/queries";
import { getPeriodRange, monthLabel, toIsoDate } from "@/lib/dates";
import { formatGNF } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await requireClient();
  const [{ data: employee }, roles, month] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).maybeSingle(),
    getEmployeeRoles(),
    Promise.resolve(getPeriodRange("month")),
  ]);
  if (!employee) notFound();

  const ranking = await getEmployeeRanking(month.from, month.to);
  const stats = ranking.find((row) => row.employee_id === id);
  const [{ count: totalWashes }, monthly, { data: history }] = await Promise.all([
    supabase
      .from("wash_employees")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", id),
    getEmployeeMonthlyActivity(id),
    supabase
      .from("wash_employees")
      .select("washes(id, occurred_at, plate, final_amount, status)")
      .eq("employee_id", id)
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`${employee.first_name} ${employee.last_name}`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lavages (total)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalWashes ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lavages du mois</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats?.wash_count ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CA associé</CardTitle>
          </CardHeader>
          <CardContent className="tabular-amount text-xl font-semibold">{formatGNF(stats?.revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prestation principale</CardTitle>
          </CardHeader>
          <CardContent>{stats?.top_service ?? "—"}</CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Le CA associé n'est pas une commission : il mesure l'activité des lavages auxquels l'employé a participé.
      </p>
      <EmployeeForm roles={roles} employee={employee} />
      <div className="space-y-2">
        <h2 className="font-semibold">Évolution mensuelle</h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore d'activité sur les 12 derniers mois.</p>
        ) : (
          monthly.map((row) => (
            <div key={row.month} className="flex justify-between rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
              <span>{monthLabel(`${row.month}-01`)}</span>
              <span>
                {row.washes} lavages · <span className="tabular-amount">{formatGNF(row.revenue)}</span>
              </span>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">Historique récent</h2>
        {(history ?? []).map((row) => {
          const wash = row.washes as { id: string; occurred_at: string; plate: string | null; final_amount: number; status: string } | null;
          if (!wash) return null;
          return (
            <div key={wash.id} className="flex justify-between rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
              <span>
                {toIsoDate(new Date(wash.occurred_at))} · {wash.plate}
              </span>
              <span className="tabular-amount">{formatGNF(wash.final_amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
