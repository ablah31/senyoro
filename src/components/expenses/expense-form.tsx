"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { attachReceiptAction, createExpenseAction } from "@/lib/actions/expenses";
import { uploadHint, uploadToBucket } from "@/lib/client-upload";
import { NATURE_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExpenseForm({
  categories,
}: {
  categories: { id: string; name: string; default_nature: "FIXE" | "VARIABLE" }[];
}) {
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const selected = categories.find((c) => c.id === categoryId);

  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        startTransition(async () => {
          try {
            const result = await createExpenseAction({
              amount: Number(form.get("amount")),
              date: String(form.get("date")),
              categoryId,
              nature: String(form.get("nature")),
              description: String(form.get("description")),
              supplier: String(form.get("supplier") || "") || null,
              paymentMethod: String(form.get("paymentMethod")),
            });
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
            toast.success("Dépense enregistrée");
            formEl.reset();
          } catch {
            toast.error("Enregistrement impossible. Réessayez.");
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label>Montant</Label>
        <Input name="amount" inputMode="numeric" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input name="date" type="date" required className="h-11" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div className="space-y-2">
        <Label>Catégorie</Label>
        <select
          className="h-11 w-full rounded-lg border bg-transparent px-3"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <select name="nature" className="h-11 w-full rounded-lg border bg-transparent px-3" defaultValue={selected?.default_nature}>
          {Object.entries(NATURE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Description</Label>
        <Input name="description" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Fournisseur</Label>
        <Input name="supplier" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Paiement</Label>
        <select name="paymentMethod" className="h-11 w-full rounded-lg border bg-transparent px-3" defaultValue="cash">
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Justificatif</Label>
        <Input
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">{uploadHint("expense-receipts")}</p>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la dépense"}
        </Button>
      </div>
    </form>
  );
}
