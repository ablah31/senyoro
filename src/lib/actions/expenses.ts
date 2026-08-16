"use server";

import { revalidatePath } from "next/cache";
import { getOrgId, requireClient, requireUser } from "@/lib/auth";
import { categorySchema, expenseSchema, recurringExpenseSchema } from "@/lib/schemas";
import { businessDate } from "@/lib/dates";

export async function createExpenseAction(input: unknown) {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const organization_id = await getOrgId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id,
      amount: parsed.data.amount,
      date: parsed.data.date,
      category_id: parsed.data.categoryId,
      nature: parsed.data.nature,
      description: parsed.data.description,
      supplier: parsed.data.supplier,
      payment_method: parsed.data.paymentMethod,
      recorded_by: user.id,
      status: "active",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/cash");
  return { success: true, id: data.id };
}

export async function cancelExpenseAction(id: string, reason: string) {
  await requireUser();
  if (!reason.trim()) return { error: "Motif d'annulation requis" };
  const supabase = await requireClient();
  const { error } = await supabase
    .from("expenses")
    .update({ status: "cancelled", cancel_reason: reason.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/cash");
  return { success: true };
}

export async function upsertCategoryAction(input: unknown) {
  await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  if (parsed.data.id) {
    const { error } = await supabase
      .from("expense_categories")
      .update({ name: parsed.data.name, default_nature: parsed.data.defaultNature })
      .eq("id", parsed.data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("expense_categories").insert({
      organization_id: await getOrgId(),
      name: parsed.data.name,
      default_nature: parsed.data.defaultNature,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/expenses");
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  await requireUser();
  const supabase = await requireClient();
  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (count && count > 0) return { error: "Cette catégorie est déjà utilisée." };
  const { error } = await supabase.from("expense_categories").delete().eq("id", id).eq("is_system", false);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function createRecurringExpenseAction(input: unknown) {
  await requireUser();
  const parsed = recurringExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const { error } = await supabase.from("recurring_expenses").insert({
    organization_id: await getOrgId(),
    category_id: parsed.data.categoryId,
    description: parsed.data.description,
    amount: parsed.data.amount,
    nature: parsed.data.nature,
    payment_method: parsed.data.paymentMethod,
    frequency: parsed.data.frequency,
    start_date: parsed.data.startDate,
    next_due_date: parsed.data.startDate,
    status: "active",
  });
  if (error) return { error: error.message };
  await supabase.rpc("generate_recurring_occurrences");
  revalidatePath("/expenses/recurring");
  return { success: true };
}

export async function generateOccurrencesAction() {
  await requireUser();
  const supabase = await requireClient();
  await supabase.rpc("generate_recurring_occurrences");
  revalidatePath("/expenses/recurring");
  return { success: true };
}

export async function confirmOccurrenceAction(occurrenceId: string) {
  const user = await requireUser();
  const supabase = await requireClient();
  const { data: occurrence, error } = await supabase
    .from("recurring_expense_occurrences")
    .select("*, recurring_expenses(*)")
    .eq("id", occurrenceId)
    .single();
  if (error || !occurrence) return { error: "Échéance introuvable" };
  const rec = occurrence.recurring_expenses as {
    category_id: string;
    description: string;
    amount: number;
    nature: "FIXE" | "VARIABLE";
    payment_method: "cash" | "mobile_money";
  } | null;
  if (!rec) return { error: "Dépense récurrente introuvable" };

  const { data: expense, error: expError } = await supabase
    .from("expenses")
    .insert({
      organization_id: await getOrgId(),
      amount: rec.amount,
      date: occurrence.due_date ?? businessDate(),
      category_id: rec.category_id,
      nature: rec.nature,
      description: rec.description,
      payment_method: rec.payment_method,
      recorded_by: user.id,
      recurring_occurrence_id: occurrenceId,
      status: "active",
    })
    .select("id")
    .single();
  if (expError) return { error: expError.message };

  await supabase
    .from("recurring_expense_occurrences")
    .update({ status: "confirmed", expense_id: expense.id })
    .eq("id", occurrenceId);

  revalidatePath("/expenses");
  revalidatePath("/expenses/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/cash");
  return { success: true };
}

export async function skipOccurrenceAction(occurrenceId: string) {
  await requireUser();
  const supabase = await requireClient();
  const { error } = await supabase
    .from("recurring_expense_occurrences")
    .update({ status: "skipped" })
    .eq("id", occurrenceId);
  if (error) return { error: error.message };
  revalidatePath("/expenses/recurring");
  return { success: true };
}

export async function attachReceiptAction(expenseId: string, path: string, fileName: string, mimeType: string) {
  await requireUser();
  const supabase = await requireClient();
  const { error } = await supabase.from("attachments").insert({
    organization_id: await getOrgId(),
    expense_id: expenseId,
    storage_path: path,
    file_name: fileName,
    mime_type: mimeType,
  });
  if (error) return { error: error.message };
  revalidatePath("/expenses");
  return { success: true };
}

export async function getReceiptUrlAction(path: string) {
  await requireUser();
  const supabase = await requireClient();
  const { data, error } = await supabase.storage.from("expense-receipts").createSignedUrl(path, 300);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
