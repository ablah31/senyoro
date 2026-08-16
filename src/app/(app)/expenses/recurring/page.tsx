import { requireClient } from "@/lib/auth";
import { getExpenseCategories } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringManager } from "@/components/expenses/recurring-manager";

export const metadata = { title: "Dépenses récurrentes" };

export default async function RecurringExpensesPage() {
  const [categories, supabase] = await Promise.all([getExpenseCategories(), requireClient()]);
  const [{ data: recurrences }, { data: occurrences }] = await Promise.all([
    supabase.from("recurring_expenses").select("*").order("next_due_date"),
    supabase
      .from("recurring_expense_occurrences")
      .select("*")
      .order("due_date", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <PageHeader
        title="Dépenses récurrentes"
        description="Les échéances ne sont jamais comptabilisées avant confirmation."
      />
      <RecurringManager
        categories={categories}
        recurrences={recurrences ?? []}
        occurrences={occurrences ?? []}
      />
    </div>
  );
}
