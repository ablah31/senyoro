"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { upsertSalaryPaymentAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalaryForm({
  employees,
}: {
  employees: { id: string; first_name: string; last_name: string; monthly_salary: number }[];
}) {
  const [pending, startTransition] = useTransition();
  const month = new Date().toISOString().slice(0, 7);

  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await upsertSalaryPaymentAction({
            employeeId: String(form.get("employeeId")),
            periodMonth: String(form.get("periodMonth")),
            expectedAmount: Number(form.get("expectedAmount")),
            paidAmount: Number(form.get("paidAmount")),
            paidAt: String(form.get("paidAt") || "") || null,
            comment: String(form.get("comment") || "") || null,
          });
          if (result.error) toast.error(result.error);
          else toast.success("Salaire enregistré et comptabilisé en dépense");
        });
      }}
    >
      <div className="space-y-2 md:col-span-2">
        <Label>Employé</Label>
        <select name="employeeId" className="h-11 w-full rounded-lg border bg-transparent px-3" required>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Mois</Label>
        <Input name="periodMonth" type="month" defaultValue={month} className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Salaire prévu</Label>
        <Input name="expectedAmount" inputMode="numeric" className="h-11" defaultValue={employees[0]?.monthly_salary ?? 0} />
      </div>
      <div className="space-y-2">
        <Label>Salaire versé</Label>
        <Input name="paidAmount" inputMode="numeric" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Date de paiement</Label>
        <Input name="paidAt" type="date" className="h-11" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Commentaire</Label>
        <Input name="comment" className="h-11" placeholder="Absences durant le mois" />
      </div>
      <Button type="submit" className="h-11 md:col-span-2" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le paiement"}
      </Button>
    </form>
  );
}
