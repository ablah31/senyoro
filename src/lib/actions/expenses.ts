"use server";

import { actionError, requireAdmin } from "@/lib/auth";
import { revalidateMutation } from "@/lib/actions/revalidate";
import { categorySchema, expenseSchema, expenseUpdateSchema, recurringExpenseSchema } from "@/lib/schemas";
import { businessDate } from "@/lib/dates";

export async function createExpenseAction(input: unknown) {
  try {
    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, user, orgId } = await requireAdmin();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        organization_id: orgId,
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
    revalidateMutation(["/expenses", "/dashboard"]);
    return { success: true, id: data.id };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateExpenseAction(input: unknown) {
  try {
    const parsed = expenseUpdateSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase } = await requireAdmin();
    const { data: existing, error: loadError } = await supabase
      .from("expenses")
      .select("id, status, salary_payment_id")
      .eq("id", parsed.data.id)
      .maybeSingle();
    if (loadError) return { error: loadError.message };
    if (!existing) return { error: "Dépense introuvable" };
    if (existing.status !== "active") return { error: "Une dépense annulée ne peut pas être modifiée" };
    if (existing.salary_payment_id) {
      return { error: "Ce versement de salaire se corrige dans Salaires." };
    }
    const { error } = await supabase
      .from("expenses")
      .update({
        amount: parsed.data.amount,
        date: parsed.data.date,
        category_id: parsed.data.categoryId,
        nature: parsed.data.nature,
        description: parsed.data.description,
        supplier: parsed.data.supplier,
        payment_method: parsed.data.paymentMethod,
      })
      .eq("id", parsed.data.id);
    if (error) return { error: error.message };
    revalidateMutation([`/expenses/${parsed.data.id}`, "/expenses", "/dashboard"]);
    return { success: true, id: parsed.data.id };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function cancelExpenseAction(id: string, reason: string) {
  try {
    if (!reason.trim()) return { error: "Motif d'annulation requis" };
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("expenses")
      .update({ status: "cancelled", cancel_reason: reason.trim() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation([`/expenses/${id}`, "/expenses", "/dashboard"]);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function upsertCategoryAction(input: unknown) {
  try {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
    if (parsed.data.id) {
      const { error } = await supabase
        .from("expense_categories")
        .update({ name: parsed.data.name, default_nature: parsed.data.defaultNature })
        .eq("id", parsed.data.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("expense_categories").insert({
        organization_id: orgId,
        name: parsed.data.name,
        default_nature: parsed.data.defaultNature,
      });
      if (error) return { error: error.message };
    }
    revalidateMutation(["/expenses", "/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { count } = await supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (count && count > 0) return { error: "Cette catégorie est déjà utilisée." };
    const { error } = await supabase.from("expense_categories").delete().eq("id", id).eq("is_system", false);
    if (error) return { error: error.message };
    revalidateMutation(["/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function createRecurringExpenseAction(input: unknown) {
  try {
    const parsed = recurringExpenseSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
    const { error } = await supabase.from("recurring_expenses").insert({
      organization_id: orgId,
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
    revalidateMutation(["/expenses/recurring"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function generateOccurrencesAction() {
  try {
    const { supabase } = await requireAdmin();
    await supabase.rpc("generate_recurring_occurrences");
    revalidateMutation(["/expenses/recurring"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function confirmOccurrenceAction(occurrenceId: string) {
  try {
    const { supabase, user, orgId } = await requireAdmin();
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
        organization_id: orgId,
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

    revalidateMutation(["/expenses", "/expenses/recurring", "/dashboard"]);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function skipOccurrenceAction(occurrenceId: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("recurring_expense_occurrences")
      .update({ status: "skipped" })
      .eq("id", occurrenceId);
    if (error) return { error: error.message };
    revalidateMutation(["/expenses/recurring"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function attachReceiptAction(expenseId: string, path: string, fileName: string, mimeType: string) {
  try {
    const { supabase, orgId } = await requireAdmin();
    const { error } = await supabase.from("attachments").insert({
      organization_id: orgId,
      expense_id: expenseId,
      storage_path: path,
      file_name: fileName,
      mime_type: mimeType,
    });
    if (error) return { error: error.message };
    revalidateMutation([`/expenses/${expenseId}`, "/expenses"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function getReceiptUrlAction(path: string) {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.storage.from("expense-receipts").createSignedUrl(path, 300);
    if (error) return { error: error.message };
    return { url: data.signedUrl };
  } catch (error) {
    return { error: actionError(error) };
  }
}
