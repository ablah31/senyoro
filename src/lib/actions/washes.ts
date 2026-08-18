"use server";

import { revalidatePath } from "next/cache";
import { getOrgId, requireClient, requireUser } from "@/lib/auth";
import { businessDate } from "@/lib/dates";
import { washSchema } from "@/lib/schemas";

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/\s+/g, " ");
}

async function ensureCashSession(date: string) {
  const supabase = await requireClient();
  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("business_date", date)
    .maybeSingle();
  if (existing) return;
  const { data: org } = await supabase
    .from("organizations")
    .select("id, default_opening_cash")
    .limit(1)
    .single();
  if (!org) return;
  await supabase.from("cash_sessions").insert({
    organization_id: org.id,
    business_date: date,
    opening_cash: org.default_opening_cash ?? 0,
    opening_mobile_money: 0,
  });
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, "");
}

async function resolveCustomerAndVehicle(input: {
  plate: string;
  vehicleTypeId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
}) {
  const supabase = await requireClient();
  const organization_id = await getOrgId();
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
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (byPhone) customerId = byPhone.id;
    }
    if (!customerId && name) {
      const { data: byName } = await supabase
        .from("customers")
        .select("id")
        .ilike("name", name)
        .limit(1)
        .maybeSingle();
      if (byName) customerId = byName.id;
    }
    if (!customerId) {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({ organization_id, name, phone })
        .select("id")
        .single();
      if (error) throw error;
      customerId = created.id;
    } else {
      const { data: existing } = await supabase
        .from("customers")
        .select("name, phone")
        .eq("id", customerId)
        .maybeSingle();
      const patch: { name?: string | null; phone?: string | null } = {};
      // Ne pas écraser un nom/téléphone déjà connus avec une saisie partielle.
      if (name && !existing?.name) patch.name = name;
      if (phone && !existing?.phone) patch.phone = phone;
      if (Object.keys(patch).length) {
        await supabase.from("customers").update(patch).eq("id", customerId);
      }
    }
  }

  let vehicleId = existingVehicle?.id ?? null;
  if (vehicleId) {
    await supabase
      .from("vehicles")
      .update({
        vehicle_type_id: input.vehicleTypeId,
        customer_id: customerId ?? existingVehicle?.customer_id,
      })
      .eq("id", vehicleId);
  } else {
    const { data: created, error } = await supabase
      .from("vehicles")
      .insert({
        organization_id,
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
  const user = await requireUser();
  const parsed = washSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;
  const supabase = await requireClient();
  const organization_id = await getOrgId();
  const date = businessDate();

  const { customerId, vehicleId, plate } = await resolveCustomerAndVehicle({
    plate: data.plate,
    vehicleTypeId: data.vehicleTypeId,
    customerId: data.customerId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
  });

  const { data: services, error: servicesError } = await supabase
    .from("service_prices")
    .select("service_id, price, services(name)")
    .eq("vehicle_type_id", data.vehicleTypeId)
    .in("service_id", data.serviceIds);
  if (servicesError) return { error: servicesError.message };

  const { data: wash, error } = await supabase
    .from("washes")
    .insert({
      organization_id,
      occurred_at: new Date().toISOString(),
      business_date: date,
      vehicle_type_id: data.vehicleTypeId,
      plate,
      customer_id: customerId,
      vehicle_id: vehicleId,
      customer_name: data.customerName?.trim() || null,
      customer_phone: data.customerPhone?.trim() || null,
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

  const serviceRows = (services ?? []).map((row) => {
    const service = row.services as { name: string } | null;
    return {
      organization_id,
      wash_id: wash.id,
      service_id: row.service_id,
      name: service?.name ?? "Prestation",
      price: row.price,
    };
  });
  if (serviceRows.length) {
    const { error: wsError } = await supabase.from("wash_services").insert(serviceRows);
    if (wsError) return { error: wsError.message };
  }

  const employeeRows = data.employeeIds.map((employeeId) => ({
    wash_id: wash.id,
    employee_id: employeeId,
    organization_id,
  }));
  const { error: weError } = await supabase.from("wash_employees").insert(employeeRows);
  if (weError) return { error: weError.message };

  await ensureCashSession(date);
  revalidatePath("/washes");
  revalidatePath("/dashboard");
  revalidatePath("/cash");
  return { id: wash.id };
}

export async function cancelWashAction(id: string, reason: string) {
  await requireUser();
  if (!reason.trim()) return { error: "Motif d'annulation requis" };
  const supabase = await requireClient();
  const { error } = await supabase
    .from("washes")
    .update({ status: "cancelled", cancel_reason: reason.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/washes");
  revalidatePath("/dashboard");
  revalidatePath("/cash");
  return { success: true };
}

export async function lookupPlateAction(plate: string) {
  await requireUser();
  const supabase = await requireClient();
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
  await requireUser();
  const supabase = await requireClient();
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
