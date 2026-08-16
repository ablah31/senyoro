import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getExpenseCategories } from "@/lib/queries";
import { periodFromSearch } from "@/lib/queries";
import { toIsoDate } from "@/lib/dates";
import { formatDate } from "@/lib/dates";
import { formatGNF } from "@/lib/format";
import { NATURE_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelector } from "@/components/shared/period-selector";
import { ListFilters } from "@/components/shared/list-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReceiptLink } from "@/components/expenses/receipt-link";

export const metadata = { title: "Dépenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; nature?: string; categoryId?: string }>;
}) {
  const params = await searchParams;
  const range = periodFromSearch(params);
  const [categories, supabase] = await Promise.all([getExpenseCategories(), requireClient()]);
  let query = supabase
    .from("expenses")
    .select("*, expense_categories(name), attachments(id, file_name, storage_path)")
    .gte("date", toIsoDate(range.from))
    .lte("date", toIsoDate(range.to))
    .order("date", { ascending: false })
    .limit(100);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.nature === "FIXE" || params.nature === "VARIABLE") {
    query = query.eq("nature", params.nature);
  }
  const { data } = await query;

  const expenses = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dépenses" description="Charges validées uniquement">
        <Button variant="outline" render={<Link href="/expenses/recurring" />}>
          Récurrentes
        </Button>
      </PageHeader>
      <PeriodSelector />
      <ListFilters
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        showNature
      />
      {(() => {
        const active = (data ?? []).filter((row) => row.status === "active");
        const fixed = active.filter((row) => row.nature === "FIXE").reduce((sum, row) => sum + Number(row.amount), 0);
        const variable = active
          .filter((row) => row.nature === "VARIABLE")
          .reduce((sum, row) => sum + Number(row.amount), 0);
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
              Charges fixes : <span className="tabular-amount font-semibold">{formatGNF(fixed)}</span>
            </p>
            <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
              Charges variables : <span className="tabular-amount font-semibold">{formatGNF(variable)}</span>
            </p>
          </div>
        );
      })()}
      <ExpenseForm categories={categories} />
      {expenses.length === 0 ? (
        <EmptyState title="Aucune dépense sur cette période." />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const category = expense.expense_categories as { name: string } | null;
            const attachments = (expense.attachments ?? []) as {
              id: string;
              file_name: string;
              storage_path: string;
            }[];
            return (
              <div key={expense.id} className="flex items-start justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(expense.date)} · {category?.name} · {NATURE_LABELS[expense.nature]}
                  </p>
                  {attachments.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {attachments.map((file) => (
                        <ReceiptLink key={file.id} path={file.storage_path} fileName={file.file_name} />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="tabular-amount font-semibold">{formatGNF(expense.amount)}</p>
                  <Badge variant={expense.status === "active" ? "secondary" : "destructive"}>
                    {expense.status === "active" ? PAYMENT_LABELS[expense.payment_method] : "Annulée"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
