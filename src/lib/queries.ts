import { cache } from "react";
import { requireClient } from "@/lib/auth";
import { toIsoDate, type PeriodKey, getPeriodRange, nowInConakry } from "@/lib/dates";
import { toAmount } from "@/lib/format";
import { startOfMonth, subMonths } from "date-fns";

export function periodFromSearch(searchParams: {
  period?: string;
  from?: string;
  to?: string;
}) {
  const key = (searchParams.period as PeriodKey) || "today";
  return getPeriodRange(key, searchParams.from, searchParams.to);
}

export async function getDashboardKpis(from: Date, to: Date) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("dashboard_kpis", {
    p_from: toIsoDate(from),
    p_to: toIsoDate(to),
  });
  if (error) throw error;
  const row = data?.[0];
  return {
    revenue: toAmount(row?.revenue),
    expenses: toAmount(row?.expenses),
    profit: toAmount(row?.profit),
    washCount: toAmount(row?.wash_count),
    avgTicket: toAmount(row?.avg_ticket),
    cashCollected: toAmount(row?.cash_collected),
    mobileCollected: toAmount(row?.mobile_collected),
  };
}

export async function getTimeseries(from: Date, to: Date, metric: string) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("metric_timeseries", {
    p_from: toIsoDate(from),
    p_to: toIsoDate(to),
    p_metric: metric,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    bucket: row.bucket,
    value: toAmount(row.value),
  }));
}

export async function getNamedSeries(
  fn:
    | "revenue_by_service"
    | "revenue_by_vehicle_type"
    | "expenses_by_category"
    | "payment_split",
  from: Date,
  to: Date,
) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc(fn, {
    p_from: toIsoDate(from),
    p_to: toIsoDate(to),
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    name: row.name,
    value: toAmount(row.value),
  }));
}

export async function getRevenueByEmployee(from: Date, to: Date) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("revenue_by_employee", {
    p_from: toIsoDate(from),
    p_to: toIsoDate(to),
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    name: row.name,
    value: toAmount(row.value),
    washCount: toAmount(row.wash_count),
  }));
}

export async function getEmployeeRanking(from: Date, to: Date) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("employee_ranking", {
    p_from: toIsoDate(from),
    p_to: toIsoDate(to),
  });
  if (error) throw error;
  return data ?? [];
}

export async function searchGlobal(query: string) {
  const supabase = await requireClient();
  const { data, error } = await supabase.rpc("global_search", { p_query: query });
  if (error) throw error;
  return data ?? [];
}

export async function getServices() {
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, service_prices(*)")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getVehicleTypes() {
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getCustomersForLookup() {
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone")
    .order("name")
    .limit(3000);
  if (error) throw error;
  return data ?? [];
}

const CUSTOMER_PAGE_SIZE = 1000;

export async function getCustomersWithPhone() {
  const supabase = await requireClient();
  const customers: { id: string; name: string | null; phone: string | null }[] = [];
  let total = Infinity;
  while (customers.length < total) {
    const { data, error, count } = await supabase
      .from("customers")
      .select("id, name, phone", { count: "exact" })
      .not("phone", "is", null)
      .order("name")
      .order("id")
      .range(customers.length, customers.length + CUSTOMER_PAGE_SIZE - 1);
    if (error) throw error;
    if (data.length === 0) break;
    customers.push(...data);
    total = count ?? customers.length;
  }
  return customers;
}

export async function getEmployees(activeOnly = false) {
  const supabase = await requireClient();
  let query = supabase
    .from("employees")
    .select("*, employee_roles(name, slug)")
    .order("first_name");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getEmployeeRoles() {
  const supabase = await requireClient();
  const { data, error } = await supabase.from("employee_roles").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getExpenseCategories() {
  const supabase = await requireClient();
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export const getOrganization = cache(async () => {
  const supabase = await requireClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, phone, address, currency, country, timezone, logo_url, created_at")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
});

export async function washIdsForFilter(filter: { employeeId?: string; serviceId?: string }) {
  const supabase = await requireClient();
  let ids: string[] | null = null;
  if (filter.employeeId) {
    const { data } = await supabase.from("wash_employees").select("wash_id").eq("employee_id", filter.employeeId);
    ids = (data ?? []).map((row) => row.wash_id);
    if (ids.length === 0) return [];
  }
  if (filter.serviceId) {
    let query = supabase.from("wash_services").select("wash_id").eq("service_id", filter.serviceId);
    if (ids) query = query.in("wash_id", ids);
    const { data } = await query;
    ids = (data ?? []).map((row) => row.wash_id);
    if (ids.length === 0) return [];
  }
  return ids;
}

export async function getEmployeeMonthlyActivity(employeeId: string) {
  const supabase = await requireClient();
  const from = toIsoDate(startOfMonth(subMonths(nowInConakry(), 11)));
  const { data, error } = await supabase
    .from("washes")
    .select("business_date, final_amount, status, wash_employees!inner(employee_id)")
    .eq("wash_employees.employee_id", employeeId)
    .eq("status", "active")
    .gte("business_date", from)
    .order("business_date");
  if (error) throw error;
  const months = new Map<string, { washes: number; revenue: number }>();
  for (const row of data ?? []) {
    const key = String(row.business_date).slice(0, 7);
    const current = months.get(key) ?? { washes: 0, revenue: 0 };
    current.washes += 1;
    current.revenue += toAmount(row.final_amount);
    months.set(key, current);
  }
  return [...months.entries()].map(([month, stats]) => ({ month, ...stats }));
}
