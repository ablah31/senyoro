import Link from "next/link";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    .select("*, expense_categories(name)")
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
  const active = expenses.filter((row) => row.status === "active");
  const fixed = active.filter((row) => row.nature === "FIXE").reduce((sum, row) => sum + Number(row.amount), 0);
  const variable = active
    .filter((row) => row.nature === "VARIABLE")
    .reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <PageHeader title="Dépenses" description="Ce qui est sorti, jour par jour">
        <Button variant="outline" className="h-11" nativeButton={false} render={<Link href="/expenses/recurring" />}>
          Récurrentes
        </Button>
        <Button className="hidden h-11 lg:inline-flex" nativeButton={false} render={<Link href="/expenses/new" />}>
          Nouvelle dépense
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Fixes</p>
          <p className="tabular-amount text-base font-semibold">{formatGNF(fixed)}</p>
        </div>
        <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Variables</p>
          <p className="tabular-amount text-base font-semibold">{formatGNF(variable)}</p>
        </div>
      </div>

      <PeriodSelector />
      <ListFilters
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        showNature
      />

      {expenses.length === 0 ? (
        <EmptyState
          title="Aucune dépense sur cette période."
          description="Notez savon, essence, réparation… dès que l'argent sort."
          actionLabel="Nouvelle dépense"
          actionHref="/expenses/new"
        />
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense, index) => {
            const category = expense.expense_categories as { name: string } | null;
            const showDate = index === 0 || expenses[index - 1]?.date !== expense.date;
            return (
              <li key={expense.id}>
                {showDate ? (
                  <p className="mb-2 mt-4 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
                    {formatDate(expense.date)}
                  </p>
                ) : null}
                <Link
                  href={`/expenses/${expense.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {category?.name} · {NATURE_LABELS[expense.nature]}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-amount font-semibold">{formatGNF(expense.amount)}</p>
                    <Badge variant={expense.status === "active" ? "secondary" : "destructive"}>
                      {expense.status === "active" ? PAYMENT_LABELS[expense.payment_method] : "Annulée"}
                    </Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        className="fixed right-4 bottom-20 z-20 h-12 gap-2 shadow-lg lg:hidden"
        nativeButton={false}
        render={<Link href="/expenses/new" />}
      >
        <Plus className="size-5" />
        Nouvelle dépense
      </Button>
    </div>
  );
}
