"use server";

import { after } from "next/server";
import { actionError, requireActionContext, type ActionContext } from "@/lib/auth";
import { revalidateMutation } from "@/lib/actions/revalidate";
import { businessDate } from "@/lib/dates";
import { washSchema } from "@/lib/schemas";
import type { createClient } from "@/lib/supabase/server";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/\s+/g, " ");
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, "");
}

async function ensureCashSession(
  supabase: AppSupabaseClient,
  organizationId: string,
  date: string,
  openingCash = 0,
) {
  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("business_date", date)
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase.from("cash_sessions").insert({
    organization_id: organizationId,
    business_date: date,
    opening_cash: openingCash,
    opening_mobile_money: 0,
  });
  // Ignore race if another request created the session first.
  if (error && error.code !== "23505") {
    console.error("ensureCashSession", error.message);
  }
}

async function resolveCustomerAndVehicle(
  supabase: AppSupabaseClient,
  organizationId: string,
  input: {
    plate: string;
    vehicleTypeId: string;
    customerId?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
  },
) {
  const plate = normalizePlate(input.plate);

  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id, customer_id")
    .eq("plate", plate)
    .maybeSingle();

  let customerId = input.customerId ?? existingVehicle?.customer_id ?? null;
  const name = input.customerName?.trim() || null;
  const phone = input.customerPhone ? normalizePhone(input.customerPhone) || null : null;

  if (customerId) {
    const { data: selected } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("id", customerId)
      .maybeSingle();
    if (!selected) {
      customerId = null;
    } else {
      const patch: { name?: string | null; phone?: string | null } = {};
      if (name && name !== selected.name) patch.name = name;
      if (phone && phone !== selected.phone) patch.phone = phone;
      if (Object.keys(patch).length) {
        await supabase.from("customers").update(patch).eq("id", customerId);
      }
    }
  }

  if (!customerId && (name || phone)) {
    if (phone) {
      const { data: byPhone } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("phone", phone)
        .maybeSingle();
      if (byPhone) {
        customerId = byPhone.id;
        const patch: { name?: string | null; phone?: string | null } = {};
        if (name && !byPhone.name) patch.name = name;
        if (phone && !byPhone.phone) patch.phone = phone;
        if (Object.keys(patch).length) {
          await supabase.from("customers").update(patch).eq("id", customerId);
        }
      }
    }
    if (!customerId && name) {
      const { data: byName } = await supabase
        .from("customers")
        .select("id, name, phone")
        .ilike("name", name)
        .limit(1)
        .maybeSingle();
      if (byName) {
        customerId = byName.id;
        if (phone && !byName.phone) {
          await supabase.from("customers").update({ phone }).eq("id", customerId);
        }
      }
    }
    if (!customerId) {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({ organization_id: organizationId, name, phone })
        .select("id")
        .single();
      if (error) throw error;
      customerId = created.id;
    }
  }

  let vehicleId = existingVehicle?.id ?? null;
  if (vehicleId) {
    const nextCustomerId = customerId ?? existingVehicle?.customer_id ?? null;
    await supabase
      .from("vehicles")
      .update({
        vehicle_type_id: input.vehicleTypeId,
        customer_id: nextCustomerId,
      })
      .eq("id", vehicleId);
  } else {
    const { data: created, error } = await supabase
      .from("vehicles")
      .insert({
        organization_id: organizationId,
        plate,
        vehicle_type_id: input.vehicleTypeId,
        customer_id: customerId,
      })
      .select("id")
      .single();
    if (error) throw error;
    vehicleId = created.id;
  }

  return { customerId, vehicleId, plate };
}

export async function createWashAction(input: unknown) {
  try {
    const parsed = washSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const data = parsed.data;
    const { supabase, user, orgId }: ActionContext = await requireActionContext();
    const date = businessDate();

    const [resolved, servicesResult, orgDefaults] = await Promise.all([
      resolveCustomerAndVehicle(supabase, orgId, {
        plate: data.plate,
        vehicleTypeId: data.vehicleTypeId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }),
      supabase
        .from("service_prices")
        .select("service_id, price, services(name)")
        .eq("vehicle_type_id", data.vehicleTypeId)
        .in("service_id", data.serviceIds),
      supabase.from("organizations").select("default_opening_cash").eq("id", orgId).maybeSingle(),
    ]);

    if (servicesResult.error) return { error: servicesResult.error.message };
    const services = servicesResult.data ?? [];
    if (services.length === 0) {
      return { error: "Tarif introuvable pour les prestations sélectionnées" };
    }

    const { customerId, vehicleId, plate } = resolved;

    const { data: wash, error } = await supabase
      .from("washes")
      .insert({
        organization_id: orgId,
        occurred_at: new Date().toISOString(),
        business_date: date,
        vehicle_type_id: data.vehicleTypeId,
        plate,
        customer_id: customerId,
        vehicle_id: vehicleId,
        customer_name: data.customerName?.trim() || null,
        customer_phone: data.customerPhone ? normalizePhone(data.customerPhone) || null : null,
        payment_method: data.paymentMethod,
        theoretical_amount: data.theoreticalAmount,
        final_amount: data.finalAmount,
        discount_reason: data.theoreticalAmount === data.finalAmount ? null : data.discountReason,
        discount_note: data.discountNote,
        note: data.note,
        created_by: user.id,
        status: "active",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    const serviceRows = services.map((row) => {
      const service = row.services as { name: string } | null;
      return {
        organization_id: orgId,
        wash_id: wash.id,
        service_id: row.service_id,
        name: service?.name ?? "Prestation",
        price: row.price,
      };
    });
    const employeeRows = data.employeeIds.map((employeeId) => ({
      wash_id: wash.id,
      employee_id: employeeId,
      organization_id: orgId,
    }));

    const [wsResult, weResult] = await Promise.all([
      serviceRows.length
        ? supabase.from("wash_services").insert(serviceRows)
        : Promise.resolve({ error: null }),
      supabase.from("wash_employees").insert(employeeRows),
    ]);
    if (wsResult.error) return { error: wsResult.error.message };
    if (weResult.error) return { error: weResult.error.message };

    const openingCash = Number(orgDefaults.data?.default_opening_cash ?? 0);
    after(() => {
      void ensureCashSession(supabase, orgId, date, openingCash);
    });

    revalidateMutation(["/washes", "/cash", "/dashboard", "/customers"]);
    return { id: wash.id };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function cancelWashAction(id: string, reason: string) {
  try {
    if (!reason.trim()) return { error: "Motif d'annulation requis" };
    const { supabase } = await requireActionContext();
    const { error } = await supabase
      .from("washes")
      .update({ status: "cancelled", cancel_reason: reason.trim() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation(["/washes", "/cash", "/dashboard"]);
    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function lookupPlateAction(plate: string) {
  const { supabase } = await requireActionContext();
  const normalized = normalizePlate(plate);
  if (!normalized) return [];
  const { data } = await supabase
    .from("vehicles")
    .select("id, plate, vehicle_type_id, customer_id, customers(name, phone)")
    .ilike("plate", `${normalized}%`)
    .limit(8);
  return data ?? [];
}

export async function lookupCustomerAction(query: string) {
  const { supabase } = await requireActionContext();
  const q = query.trim().replace(/[%(),]/g, "");
  if (q.length < 2) return [];

  const digits = normalizePhone(q);
  const isPhoneQuery = /\d{2,}/.test(digits);

  let request = supabase
    .from("customers")
    .select("id, name, phone, vehicles(plate, vehicle_type_id)")
    .order("name", { ascending: true })
    .limit(8);

  if (isPhoneQuery) {
    request = request.ilike("phone", `%${digits}%`);
  } else {
    request = request.ilike("name", `%${q}%`);
  }

  const { data } = await request;
  return (data ?? []).map((row) => {
    const vehicles = Array.isArray(row.vehicles) ? row.vehicles : [];
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      vehicles: vehicles.map((vehicle) => ({
        plate: vehicle.plate,
        vehicle_type_id: vehicle.vehicle_type_id,
      })),
    };
  });
}
