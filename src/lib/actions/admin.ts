"use server";

import { actionError, requireActionContext } from "@/lib/auth";
import { revalidateMutation } from "@/lib/actions/revalidate";
import {
  cashCloseSchema,
  cashOpenSchema,
  employeeSchema,
  goalSchema,
  organizationSchema,
  salaryPaymentSchema,
  serviceSchema,
  vehicleTypeSchema,
} from "@/lib/schemas";

export async function upsertServiceAction(input: unknown) {
  try {
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    let serviceId = parsed.data.id;
    if (serviceId) {
      const { error } = await supabase
        .from("services")
        .update({
          name: parsed.data.name,
          description: parsed.data.description,
          reference_price: parsed.data.referencePrice,
        })
        .eq("id", serviceId);
      if (error) return { error: error.message };
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert({
          organization_id: orgId,
          name: parsed.data.name,
          description: parsed.data.description,
          reference_price: parsed.data.referencePrice,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      serviceId = data.id;
    }

    await supabase.from("service_prices").delete().eq("service_id", serviceId);
    const { error: priceError } = await supabase.from("service_prices").insert(
      parsed.data.prices.map((p) => ({
        organization_id: orgId,
        service_id: serviceId!,
        vehicle_type_id: p.vehicleTypeId,
        price: p.price,
      })),
    );
    if (priceError) return { error: priceError.message };
    revalidateMutation(["/services", "/settings", "/washes/new"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function toggleServiceAction(id: string, isActive: boolean) {
  try {
    const { supabase } = await requireActionContext();
    const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation(["/services", "/washes/new"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    const { supabase } = await requireActionContext();
    const { count } = await supabase
      .from("wash_services")
      .select("id", { count: "exact", head: true })
      .eq("service_id", id);
    if (count && count > 0) {
      return { error: "Cette prestation a déjà été utilisée. Désactivez-la plutôt." };
    }
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation(["/services"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function upsertVehicleTypeAction(input: unknown) {
  try {
    const parsed = vehicleTypeSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const slug = parsed.data.slug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");
    if (parsed.data.id) {
      const { error } = await supabase
        .from("vehicle_types")
        .update({ name: parsed.data.name, slug })
        .eq("id", parsed.data.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("vehicle_types").insert({
        organization_id: orgId,
        name: parsed.data.name,
        slug,
      });
      if (error) return { error: error.message };
    }
    revalidateMutation(["/services", "/settings", "/washes/new"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function upsertEmployeeAction(input: unknown) {
  try {
    const parsed = employeeSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const payload = {
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
      role_id: parsed.data.roleId,
      monthly_salary: parsed.data.monthlySalary,
      hired_at: parsed.data.hiredAt,
      address: parsed.data.address,
      notes: parsed.data.notes,
      photo_url: parsed.data.photoUrl,
    };
    if (parsed.data.id) {
      const { error } = await supabase.from("employees").update(payload).eq("id", parsed.data.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("employees")
        .insert({ ...payload, is_active: true, organization_id: orgId });
      if (error) return { error: error.message };
    }
    revalidateMutation(["/employees"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function toggleEmployeeAction(id: string, isActive: boolean) {
  try {
    const { supabase } = await requireActionContext();
    const { error } = await supabase.from("employees").update({ is_active: isActive }).eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation(["/employees"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function upsertSalaryPaymentAction(input: unknown) {
  try {
    const parsed = salaryPaymentSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const month = parsed.data.periodMonth.slice(0, 7) + "-01";
    const { error } = await supabase.from("salary_payments").upsert(
      {
        organization_id: orgId,
        employee_id: parsed.data.employeeId,
        period_month: month,
        expected_amount: parsed.data.expectedAmount,
        paid_amount: parsed.data.paidAmount,
        paid_at: parsed.data.paidAt,
        comment: parsed.data.comment,
      },
      { onConflict: "employee_id,period_month" },
    );
    if (error) return { error: error.message };
    revalidateMutation(["/salaries", "/expenses", "/dashboard"]);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function openCashAction(input: unknown) {
  try {
    const parsed = cashOpenSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const { error } = await supabase.from("cash_sessions").upsert(
      {
        organization_id: orgId,
        business_date: parsed.data.businessDate,
        opening_cash: parsed.data.openingCash,
        opening_mobile_money: parsed.data.openingMobileMoney,
      },
      { onConflict: "organization_id,business_date" },
    );
    if (error) return { error: error.message };
    revalidateMutation(["/cash"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function closeCashAction(input: unknown) {
  try {
    const parsed = cashCloseSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase } = await requireActionContext();
    const { error } = await supabase
      .from("cash_sessions")
      .update({
        counted_cash: parsed.data.countedCash,
        counted_mobile_money: parsed.data.countedMobileMoney,
        comment: parsed.data.comment,
        closed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.sessionId);
    if (error) return { error: error.message };
    revalidateMutation(["/cash"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function upsertGoalAction(input: unknown) {
  try {
    const parsed = goalSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const month = parsed.data.periodMonth.slice(0, 7) + "-01";
    const { error } = await supabase.from("financial_goals").upsert(
      {
        organization_id: orgId,
        period_month: month,
        revenue_target: parsed.data.revenueTarget,
        washes_target: parsed.data.washesTarget,
      },
      { onConflict: "organization_id,period_month" },
    );
    if (error) return { error: error.message };
    revalidateMutation(["/dashboard", "/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateOrganizationAction(input: unknown) {
  try {
    const parsed = organizationSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireActionContext();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: parsed.data.name,
        phone: parsed.data.phone,
        address: parsed.data.address,
        default_opening_cash: parsed.data.defaultOpeningCash,
      })
      .eq("id", orgId);
    if (error) return { error: error.message };
    revalidateMutation(["/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateOrganizationLogoAction(url: string) {
  try {
    const { supabase, orgId } = await requireActionContext();
    const { error } = await supabase.from("organizations").update({ logo_url: url }).eq("id", orgId);
    if (error) return { error: error.message };
    revalidateMutation(["/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}
