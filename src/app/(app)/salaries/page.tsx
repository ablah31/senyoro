import { requireClient } from "@/lib/auth";
import { getEmployees } from "@/lib/queries";
import { SALARY_STATUS_LABELS } from "@/lib/constants";
import { formatGNF } from "@/lib/format";
import { monthLabel } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { SalaryForm } from "@/components/salaries/salary-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Salaires" };

export default async function SalariesPage() {
  const [employees, supabase] = await Promise.all([getEmployees(true), requireClient()]);
  const { data } = await supabase
    .from("salary_payments")
    .select("*, employees(first_name, last_name)")
    .order("period_month", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <PageHeader title="Salaires" description="Un salaire versé est automatiquement une dépense." />
      <SalaryForm employees={employees} />
      <div className="space-y-3">
        {(data ?? []).map((row) => {
          const employee = row.employees as { first_name: string; last_name: string } | null;
          return (
            <div key={row.id} className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div>
                <p className="font-medium">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {monthLabel(row.period_month)} · prévu {formatGNF(row.expected_amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-amount font-semibold">{formatGNF(row.paid_amount)}</p>
                <Badge variant="secondary">{SALARY_STATUS_LABELS[row.status]}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
