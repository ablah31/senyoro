import { getExpenseCategories } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata = { title: "Nouvelle dépense" };

export default async function NewExpensePage() {
  const categories = await getExpenseCategories();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nouvelle dépense" description="Notez ce qui sort, en quelques champs." />
      <ExpenseForm categories={categories} />
    </div>
  );
}
