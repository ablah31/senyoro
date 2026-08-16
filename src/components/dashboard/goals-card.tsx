"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { upsertGoalAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatGNF } from "@/lib/format";

export function GoalsCard({
  periodMonth,
  revenueTarget,
  washesTarget,
  revenue,
  washes,
}: {
  periodMonth: string;
  revenueTarget: number;
  washesTarget: number;
  revenue: number;
  washes: number;
}) {
  const [pending, startTransition] = useTransition();
  const revenuePct = revenueTarget > 0 ? Math.min(100, Math.round((revenue / revenueTarget) * 100)) : 0;
  const washesPct = washesTarget > 0 ? Math.min(100, Math.round((washes / washesTarget) * 100)) : 0;

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="font-semibold">Objectifs du mois</p>
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span>CA {formatGNF(revenue)}</span>
          <span>{revenuePct} %</span>
        </div>
        <Progress value={revenuePct} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span>{washes} lavages</span>
          <span>{washesPct} %</span>
        </div>
        <Progress value={washesPct} />
      </div>
      <form
        className="grid gap-2 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await upsertGoalAction({
              periodMonth,
              revenueTarget: Number(form.get("revenueTarget")),
              washesTarget: Number(form.get("washesTarget")),
            });
            if (result.error) toast.error(result.error);
            else toast.success("Objectifs mis à jour");
          });
        }}
      >
        <Input name="revenueTarget" defaultValue={revenueTarget} className="h-11" />
        <Input name="washesTarget" defaultValue={washesTarget} className="h-11" />
        <Button className="h-11" disabled={pending}>
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
