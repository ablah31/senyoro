"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  confirmOccurrenceAction,
  createRecurringExpenseAction,
  generateOccurrencesAction,
  skipOccurrenceAction,
} from "@/lib/actions/expenses";
import { FREQUENCY_LABELS, NATURE_LABELS, OCCURRENCE_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatGNF } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecurringManager({
  categories,
  recurrences,
  occurrences,
}: {
  categories: { id: string; name: string; default_nature: "FIXE" | "VARIABLE" }[];
  recurrences: {
    id: string;
    description: string;
    amount: number;
    frequency: "weekly" | "monthly" | "yearly";
    next_due_date: string;
    status: string;
  }[];
  occurrences: { id: string; label: string; due_date: string; status: "pending" | "confirmed" | "skipped" }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <form
        className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await createRecurringExpenseAction({
              categoryId: String(form.get("categoryId")),
              description: String(form.get("description")),
              amount: Number(form.get("amount")),
              nature: String(form.get("nature")),
              paymentMethod: String(form.get("paymentMethod")),
              frequency: String(form.get("frequency")),
              startDate: String(form.get("startDate")),
            });
            if (result.error) toast.error(result.error);
            else toast.success("Récurrence créée");
          });
        }}
      >
        <div className="space-y-2 md:col-span-2">
          <Label>Libellé</Label>
          <Input name="description" required className="h-11" placeholder="Loyer" />
        </div>
        <div className="space-y-2">
          <Label>Montant</Label>
          <Input name="amount" inputMode="numeric" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Début / prochaine échéance</Label>
          <Input name="startDate" type="date" required className="h-11" />
        </div>
        <select name="categoryId" className="h-11 rounded-lg border bg-transparent px-3">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="frequency" className="h-11 rounded-lg border bg-transparent px-3" defaultValue="monthly">
          {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="nature" className="h-11 rounded-lg border bg-transparent px-3" defaultValue="FIXE">
          {Object.entries(NATURE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="paymentMethod" className="h-11 rounded-lg border bg-transparent px-3" defaultValue="cash">
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button className="h-11 md:col-span-2" disabled={pending}>
          Créer la récurrence
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Échéances à confirmer</h2>
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              await generateOccurrencesAction();
              toast.success("Échéances générées");
            })
          }
        >
          Générer
        </Button>
      </div>
      <div className="space-y-2">
        {occurrences.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{OCCURRENCE_LABELS[item.status]}</p>
            </div>
            {item.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await confirmOccurrenceAction(item.id);
                      if (result.error) toast.error(result.error);
                      else toast.success("Dépense confirmée");
                    })
                  }
                >
                  Confirmer
                </Button>
                <Button size="sm" variant="outline" onClick={() => skipOccurrenceAction(item.id)}>
                  Ignorer
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <h2 className="font-semibold">Récurrences</h2>
      <div className="space-y-2">
        {recurrences.map((item) => (
          <div key={item.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="font-medium">{item.description}</p>
            <p className="text-sm text-muted-foreground">
              {formatGNF(item.amount)} · {FREQUENCY_LABELS[item.frequency]} · prochaine {item.next_due_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
