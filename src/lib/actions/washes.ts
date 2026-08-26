"use server";

import { actionError, requireActionContext, type ActionContext } from "@/lib/auth";
import { revalidateMutation } from "@/lib/actions/revalidate";
import { businessDate, nowInConakry, toUtcFromBusinessDate } from "@/lib/dates";
import { washSchema } from "@/lib/schemas";
import { toAmount } from "@/lib/format";
import type { AppRole } from "@/lib/roles";
import type { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function assertCanManageWashes(role: AppRole) {
  if (role !== "admin" && role !== "responsable") throw new Error("Accès refusé");
}

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/\s+/g, " ");
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, "");
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

type WashInput = z.infer<typeof washSchema>;

async function loadWashCatalog(
  supabase: AppSupabaseClient,
  data: WashInput,
): Promise<{ error: string } | { catalog: { id: string; name: string; reference_price: number | string }[]; priceByService: Map<string, number | string> }> {
  const [pricesResult, catalogResult] = await Promise.all([
    supabase
      .from("service_prices")
      .select("service_id, price")
      .eq("vehicle_type_id", data.vehicleTypeId)
      .in("service_id", data.serviceIds),
    supabase.from("services").select("id, name, reference_price").in("id", data.serviceIds),
  ]);
  if (pricesResult.error) return { error: pricesResult.error.message };
  if (catalogResult.error) return { error: catalogResult.error.message };
  const catalog = catalogResult.data ?? [];
  if (catalog.length !== data.serviceIds.length) {
    return { error: "Tarif introuvable pour les prestations sélectionnées" };
  }
  return {
    catalog,
    priceByService: new Map((pricesResult.data ?? []).map((row) => [row.service_id, row.price] as const)),
  };
}

function washLineRows(
  orgId: string,
  washId: string,
  catalog: { id: string; name: string; reference_price: number | string }[],
  priceByService: Map<string, number | string>,
  employeeIds: string[],
) {
  return {
    serviceRows: catalog.map((service) => ({
      organization_id: orgId,
      wash_id: washId,
      service_id: service.id,
      name: service.name,
      price: toAmount(
        priceByService.has(service.id) ? priceByService.get(service.id) : service.reference_price,
      ),
    })),
    employeeRows: employeeIds.map((employeeId) => ({
      wash_id: washId,
      employee_id: employeeId,
      organization_id: orgId,
    })),
  };
}

export async function createWashAction(input: unknown) {
  try {
    const parsed = washSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const data = parsed.data;
    const { supabase, user, orgId, role }: ActionContext = await requireActionContext();
    assertCanManageWashes(role);
    const today = businessDate();
    const date = data.businessDate ?? today;
    if (date > today) {
      return { error: "La date du lavage ne peut pas être dans le futur" };
    }
    const now = nowInConakry();
    const occurredAt =
      date === today
        ? new Date().toISOString()
        : toUtcFromBusinessDate(date, now.getHours(), now.getMinutes());

    const [resolved, catalogLoaded] = await Promise.all([
      resolveCustomerAndVehicle(supabase, orgId, {
        plate: data.plate,
        vehicleTypeId: data.vehicleTypeId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }),
      loadWashCatalog(supabase, data),
    ]);

    if ("error" in catalogLoaded) return { error: catalogLoaded.error };
    const { catalog, priceByService } = catalogLoaded;

    const { customerId, vehicleId, plate } = resolved;

    const { data: wash, error } = await supabase
      .from("washes")
      .insert({
        organization_id: orgId,
        occurred_at: occurredAt,
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

    const { serviceRows, employeeRows } = washLineRows(
      orgId,
      wash.id,
      catalog,
      priceByService,
      data.employeeIds,
    );

    const [wsResult, weResult] = await Promise.all([
      serviceRows.length
        ? supabase.from("wash_services").insert(serviceRows)
        : Promise.resolve({ error: null }),
      supabase.from("wash_employees").insert(employeeRows),
    ]);
    if (wsResult.error) return { error: wsResult.error.message };
    if (weResult.error) return { error: weResult.error.message };

    revalidateMutation(["/washes", "/dashboard", "/customers"]);
    return { id: wash.id };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateWashAction(input: unknown) {
  try {
    const idParsed = z
      .object({ id: z.string().uuid() })
      .safeParse(input);
    const parsed = washSchema.safeParse(input);
    if (!idParsed.success || !parsed.success) {
      return { error: parsed.success ? "Lavage introuvable" : parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const data = parsed.data;
    const washId = idParsed.data.id;
    const { supabase, orgId, role } = await requireActionContext();
    assertCanManageWashes(role);

    const { data: existing, error: existingError } = await supabase
      .from("washes")
      .select("id, status")
      .eq("id", washId)
      .maybeSingle();
    if (existingError) return { error: existingError.message };
    if (!existing) return { error: "Lavage introuvable" };
    if (existing.status !== "active") return { error: "Un lavage annulé ne peut pas être modifié" };

    const [resolved, catalogLoaded] = await Promise.all([
      resolveCustomerAndVehicle(supabase, orgId, {
        plate: data.plate,
        vehicleTypeId: data.vehicleTypeId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }),
      loadWashCatalog(supabase, data),
    ]);
    if ("error" in catalogLoaded) return { error: catalogLoaded.error };
    const { catalog, priceByService } = catalogLoaded;
    const { customerId, vehicleId, plate } = resolved;

    const { error: updateError } = await supabase
      .from("washes")
      .update({
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
      })
      .eq("id", washId);
    if (updateError) return { error: updateError.message };

    const [deleteServices, deleteEmployees] = await Promise.all([
      supabase.from("wash_services").delete().eq("wash_id", washId),
      supabase.from("wash_employees").delete().eq("wash_id", washId),
    ]);
    if (deleteServices.error) return { error: deleteServices.error.message };
    if (deleteEmployees.error) return { error: deleteEmployees.error.message };

    const { serviceRows, employeeRows } = washLineRows(
      orgId,
      washId,
      catalog,
      priceByService,
      data.employeeIds,
    );
    const [wsResult, weResult] = await Promise.all([
      serviceRows.length
        ? supabase.from("wash_services").insert(serviceRows)
        : Promise.resolve({ error: null }),
      supabase.from("wash_employees").insert(employeeRows),
    ]);
    if (wsResult.error) return { error: wsResult.error.message };
    if (weResult.error) return { error: weResult.error.message };

    revalidateMutation(["/washes", "/dashboard", "/customers"]);
    return { id: washId };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function cancelWashAction(id: string, reason: string) {
  try {
    if (!reason.trim()) return { error: "Motif d'annulation requis" };
    const { supabase, role } = await requireActionContext();
    assertCanManageWashes(role);
    const { error } = await supabase
      .from("washes")
      .update({ status: "cancelled", cancel_reason: reason.trim() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidateMutation(["/washes", "/dashboard"]);
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
