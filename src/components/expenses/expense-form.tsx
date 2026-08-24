"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { attachReceiptAction, createExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
import { uploadHint, uploadToBucket } from "@/lib/client-upload";
import { businessDate } from "@/lib/dates";
import { NATURE_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ExpenseFormValues = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  nature: "FIXE" | "VARIABLE";
  description: string;
  supplier: string | null;
  paymentMethod: "cash" | "mobile_money";
};

export function ExpenseForm({
  categories,
  expense,
}: {
  categories: { id: string; name: string; default_nature: "FIXE" | "VARIABLE" }[];
  expense?: ExpenseFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? "");
  const [nature, setNature] = useState<"FIXE" | "VARIABLE">(
    expense?.nature ?? categories.find((c) => c.id === categoryId)?.default_nature ?? "VARIABLE",
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">(
    expense?.paymentMethod ?? "cash",
  );
  const isEdit = Boolean(expense);

  function save(formEl: HTMLFormElement) {
    if (pending) return;
    const form = new FormData(formEl);
    startTransition(async () => {
      try {
        const payload = {
          amount: Number(form.get("amount")),
          date: String(form.get("date")),
          categoryId,
          nature,
          description: String(form.get("description")),
          supplier: String(form.get("supplier") || "") || null,
          paymentMethod,
        };
        const result = expense
          ? await updateExpenseAction({ ...payload, id: expense.id })
          : await createExpenseAction(payload);
        if (result.error || !result.id) {
          toast.error(result.error ?? "Enregistrement impossible");
          return;
        }
        const receipt = form.get("receipt");
        if (receipt instanceof File && receipt.size > 0) {
          try {
            const uploaded = await uploadToBucket("expense-receipts", receipt);
            const attached = await attachReceiptAction(
              result.id,
              uploaded.path,
              receipt.name,
              receipt.type,
            );
            if (attached.error) toast.error(attached.error);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Justificatif non importé");
          }
        }
        toast.success(isEdit ? "Dépense mise à jour" : "Dépense enregistrée");
        router.push(`/expenses/${result.id}`);
        router.refresh();
      } catch {
        toast.error("Enregistrement impossible. Réessayez.");
      }
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(e.currentTarget);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="amount">Combien ?</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="numeric"
          required
          defaultValue={expense?.amount || ""}
          className="h-14 tabular-amount text-lg"
          placeholder="Montant en GNF"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Paiement</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "mobile_money"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "min-h-14 rounded-xl text-sm font-medium ring-1 transition-colors",
                paymentMethod === method
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted",
              )}
            >
              {PAYMENT_LABELS[method]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <select
          id="category"
          className="h-12 w-full rounded-xl border bg-transparent px-3"
          value={categoryId}
          onChange={(e) => {
            const nextId = e.target.value;
            setCategoryId(nextId);
            const next = categories.find((c) => c.id === nextId);
            if (next) setNature(next.default_nature);
          }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Type de charge</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["FIXE", "VARIABLE"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setNature(value)}
              className={cn(
                "min-h-12 rounded-xl text-sm font-medium ring-1 transition-colors",
                nature === value
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted",
              )}
            >
              {NATURE_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="description">Pour quoi ?</Label>
        <Input
          id="description"
          name="description"
          required
          defaultValue={expense?.description ?? ""}
          className="h-12"
          placeholder="Savon, essence, réparation…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          required
          className="h-12"
          defaultValue={expense?.date ?? businessDate()}
        />
      </div>

      <details className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <summary className="cursor-pointer text-sm font-medium">Plus d&apos;infos (facultatif)</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur</Label>
            <Input
              id="supplier"
              name="supplier"
              defaultValue={expense?.supplier ?? ""}
              className="h-12"
              placeholder="Nom du fournisseur"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Justificatif</Label>
            <Input
              id="receipt"
              name="receipt"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">{uploadHint("expense-receipts")}</p>
          </div>
        </div>
      </details>

      <Button type="submit" className="h-12 w-full" disabled={pending}>
        {pending ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Enregistrer la dépense"}
      </Button>
    </form>
  );
}
