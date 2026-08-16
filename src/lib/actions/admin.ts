"use server";

import { revalidatePath } from "next/cache";
import { getOrgId, requireClient, requireUser } from "@/lib/auth";
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
  await requireUser();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const orgId = await getOrgId();
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
        organization_id: await getOrgId(),
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
  revalidatePath("/services");
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleServiceAction(id: string, isActive: boolean) {
  await requireUser();
  const supabase = await requireClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/services");
  return { success: true };
}

export async function deleteServiceAction(id: string) {
  await requireUser();
  const supabase = await requireClient();
  const { count } = await supabase
    .from("wash_services")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);
  if (count && count > 0) {
    return { error: "Cette prestation a déjà été utilisée. Désactivez-la plutôt." };
  }
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/services");
  return { success: true };
}

export async function upsertVehicleTypeAction(input: unknown) {
  await requireUser();
  const parsed = vehicleTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
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
      organization_id: await getOrgId(),
      name: parsed.data.name,
      slug,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/services");
  revalidatePath("/settings");
  return { success: true };
}

export async function upsertEmployeeAction(input: unknown) {
  await requireUser();
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
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
      .insert({ ...payload, is_active: true, organization_id: await getOrgId() });
    if (error) return { error: error.message };
  }
  revalidatePath("/employees");
  return { success: true };
}

export async function toggleEmployeeAction(id: string, isActive: boolean) {
  await requireUser();
  const supabase = await requireClient();
  const { error } = await supabase.from("employees").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/employees");
  return { success: true };
}

export async function upsertSalaryPaymentAction(input: unknown) {
  await requireUser();
  const parsed = salaryPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  if (!org) return { error: "Organisation introuvable" };
  const month = parsed.data.periodMonth.slice(0, 7) + "-01";
  const { error } = await supabase.from("salary_payments").upsert(
    {
      organization_id: org.id,
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
  revalidatePath("/salaries");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function openCashAction(input: unknown) {
  await requireUser();
  const parsed = cashOpenSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  if (!org) return { error: "Organisation introuvable" };
  const { error } = await supabase.from("cash_sessions").upsert(
    {
      organization_id: org.id,
      business_date: parsed.data.businessDate,
      opening_cash: parsed.data.openingCash,
      opening_mobile_money: parsed.data.openingMobileMoney,
    },
    { onConflict: "organization_id,business_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/cash");
  return { success: true };
}

export async function closeCashAction(input: unknown) {
  await requireUser();
  const parsed = cashCloseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
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
  revalidatePath("/cash");
  return { success: true };
}

export async function upsertGoalAction(input: unknown) {
  await requireUser();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  if (!org) return { error: "Organisation introuvable" };
  const month = parsed.data.periodMonth.slice(0, 7) + "-01";
  const { error } = await supabase.from("financial_goals").upsert(
    {
      organization_id: org.id,
      period_month: month,
      revenue_target: parsed.data.revenueTarget,
      washes_target: parsed.data.washesTarget,
    },
    { onConflict: "organization_id,period_month" },
  );
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateOrganizationAction(input: unknown) {
  await requireUser();
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await requireClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  if (!org) return { error: "Organisation introuvable" };
  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      default_opening_cash: parsed.data.defaultOpeningCash,
    })
    .eq("id", org.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateOrganizationLogoAction(url: string) {
  await requireUser();
  const supabase = await requireClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  if (!org) return { error: "Organisation introuvable" };
  const { error } = await supabase.from("organizations").update({ logo_url: url }).eq("id", org.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}
