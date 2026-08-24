import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getExpenseCategories } from "@/lib/queries";
import { NATURE_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { formatGNF, toAmount } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { CancelExpenseButton } from "@/components/expenses/cancel-expense-button";
import { ReceiptLink } from "@/components/expenses/receipt-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dépense" };

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, supabase] = await Promise.all([getExpenseCategories(), requireClient()]);
  const { data: expense } = await supabase
    .from("expenses")
    .select("*, expense_categories(name), attachments(id, file_name, storage_path)")
    .eq("id", id)
    .maybeSingle();

  if (!expense) notFound();

  const category = expense.expense_categories as { name: string } | null;
  const attachments = (expense.attachments ?? []) as {
    id: string;
    file_name: string;
    storage_path: string;
  }[];
  const canEdit = expense.status === "active" && !expense.salary_payment_id;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title={expense.description}
        description={`${formatDate(expense.date)} · ${category?.name ?? "Sans catégorie"}`}
      >
        <Badge variant={expense.status === "active" ? "secondary" : "destructive"}>
          {expense.status === "active" ? PAYMENT_LABELS[expense.payment_method] : "Annulée"}
        </Badge>
      </PageHeader>

      <p className="tabular-amount text-3xl font-semibold">{formatGNF(expense.amount)}</p>

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <ReceiptLink key={file.id} path={file.storage_path} fileName={file.file_name} />
          ))}
        </div>
      ) : null}

      {expense.cancel_reason ? (
        <p className="text-sm text-muted-foreground">Annulation : {expense.cancel_reason}</p>
      ) : null}

      {canEdit ? (
        <>
          <ExpenseForm
            categories={categories}
            expense={{
              id: expense.id,
              amount: toAmount(expense.amount),
              date: expense.date,
              categoryId: expense.category_id,
              nature: expense.nature,
              description: expense.description,
              supplier: expense.supplier,
              paymentMethod: expense.payment_method,
            }}
          />
          <CancelExpenseButton id={expense.id} />
        </>
      ) : (
        <div className="space-y-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <p>Type : {NATURE_LABELS[expense.nature]}</p>
          <p>Paiement : {PAYMENT_LABELS[expense.payment_method]}</p>
          {expense.supplier ? <p>Fournisseur : {expense.supplier}</p> : null}
          {expense.salary_payment_id ? (
            <p>Cette ligne vient d&apos;un salaire. Corrigez-la dans Salaires.</p>
          ) : null}
        </div>
      )}

      <Button variant="outline" className="h-12 w-full" nativeButton={false} render={<Link href="/expenses" />}>
        Retour aux dépenses
      </Button>
    </div>
  );
}
