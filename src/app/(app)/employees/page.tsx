import Link from "next/link";
import { getEmployeeRoles, getEmployees } from "@/lib/queries";
import { formatGNF } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Employés" };

export default async function EmployeesPage() {
  const [employees, roles] = await Promise.all([getEmployees(), getEmployeeRoles()]);

  return (
    <div className="space-y-8">
      <PageHeader title="Employés" description="Pas de suppression définitive, uniquement désactivation." />
      <EmployeeForm roles={roles} />
      <div className="space-y-3">
        {employees.map((employee) => {
          const role = employee.employee_roles as { name: string } | null;
          return (
            <Link
              key={employee.id}
              href={`/employees/${employee.id}`}
              className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {employee.photo_url ? <AvatarImage src={employee.photo_url} alt="" /> : null}
                  <AvatarFallback>
                    {employee.first_name.slice(0, 1)}
                    {employee.last_name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                <p className="font-medium">
                  {employee.first_name} {employee.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role?.name ?? "Sans fonction"} · {formatGNF(employee.monthly_salary)}
                </p>
                </div>
              </div>
              <Badge variant={employee.is_active ? "secondary" : "outline"}>
                {employee.is_active ? "Actif" : "Inactif"}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
