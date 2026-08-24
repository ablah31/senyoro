"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { actionError, requireAdmin } from "@/lib/auth";
import { revalidateMutation } from "@/lib/actions/revalidate";
import {
  employeeSchema,
  goalSchema,
  organizationSchema,
  salaryPaymentSchema,
  serviceSchema,
  serviceNameSchema,
  servicePriceSchema,
  serviceGlobalPriceSchema,
  vehicleTypeSchema,
} from "@/lib/schemas";

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length >= 2 ? slug : `type-${crypto.randomUUID().slice(0, 8)}`;
}

function uniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function upsertServiceAction(input: unknown) {
  try {
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
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

    if (parsed.data.prices.length > 0) {
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
    }
    revalidateMutation(["/services", "/settings", "/washes/new"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateServicePriceAction(input: unknown) {
  try {
    const parsed = servicePriceSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
    const { error } = await supabase.from("service_prices").upsert(
      {
        organization_id: orgId,
        service_id: parsed.data.serviceId,
        vehicle_type_id: parsed.data.vehicleTypeId,
        price: parsed.data.price,
      },
      { onConflict: "service_id,vehicle_type_id" },
    );
    if (error) return { error: error.message };
    after(() => {
      revalidatePath("/washes/new");
    });
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateServiceGlobalPriceAction(input: unknown) {
  try {
    const parsed = serviceGlobalPriceSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
    const { error: serviceError } = await supabase
      .from("services")
      .update({ reference_price: parsed.data.price })
      .eq("id", parsed.data.serviceId);
    if (serviceError) return { error: serviceError.message };

    const { data: types, error: typesError } = await supabase
      .from("vehicle_types")
      .select("id")
      .eq("organization_id", orgId);
    if (typesError) return { error: typesError.message };

    if (types && types.length > 0) {
      const { error: priceError } = await supabase.from("service_prices").upsert(
        types.map((type) => ({
          organization_id: orgId,
          service_id: parsed.data.serviceId,
          vehicle_type_id: type.id,
          price: parsed.data.price,
        })),
        { onConflict: "service_id,vehicle_type_id" },
      );
      if (priceError) return { error: priceError.message };
    }

    after(() => {
      revalidatePath("/washes/new");
    });
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateServiceNameAction(input: unknown) {
  try {
    const parsed = serviceNameSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("services").update({ name: parsed.data.name }).eq("id", parsed.data.id);
    if (error) return { error: error.message };
    after(() => {
      revalidatePath("/washes/new");
    });
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function toggleServiceAction(id: string, isActive: boolean) {
  try {
    const { supabase } = await requireAdmin();
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
    const { supabase } = await requireAdmin();
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
    const { supabase, orgId } = await requireAdmin();
    const name = parsed.data.name;
    if (parsed.data.id) {
      const { error } = await supabase.from("vehicle_types").update({ name }).eq("id", parsed.data.id);
      if (uniqueViolation(error)) return { error: "Ce type de véhicule existe déjà." };
      if (error) return { error: error.message };
      after(() => {
        revalidatePath("/washes/new");
        revalidatePath("/settings");
      });
      return { success: true };
    }

    const { data: last } = await supabase
      .from("vehicle_types")
      .select("sort_order")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("vehicle_types")
      .insert({
        organization_id: orgId,
        name,
        slug: toSlug(parsed.data.slug ?? name),
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (uniqueViolation(error)) return { error: "Ce type de véhicule existe déjà." };
    if (error) return { error: error.message };
    if (!data) return { error: "Type non créé" };

    const { data: services } = await supabase
      .from("services")
      .select("id, reference_price")
      .eq("organization_id", orgId);
    if (services && services.length > 0) {
      const { error: priceError } = await supabase.from("service_prices").insert(
        services.map((service) => ({
          organization_id: orgId,
          service_id: service.id,
          vehicle_type_id: data.id,
          price: service.reference_price,
        })),
      );
      if (priceError) return { error: priceError.message };
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
    const { supabase, orgId } = await requireAdmin();
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
    const { supabase } = await requireAdmin();
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
    const { supabase, orgId } = await requireAdmin();
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

export async function upsertGoalAction(input: unknown) {
  try {
    const parsed = goalSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    const { supabase, orgId } = await requireAdmin();
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
    const { supabase, orgId } = await requireAdmin();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: parsed.data.name,
        phone: parsed.data.phone,
        address: parsed.data.address,
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
    const { supabase, orgId } = await requireAdmin();
    const { error } = await supabase.from("organizations").update({ logo_url: url }).eq("id", orgId);
    if (error) return { error: error.message };
    revalidateMutation(["/settings"], false);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}
