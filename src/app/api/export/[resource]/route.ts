import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(";"), ...rows.map((row) => headers.map((h) => escape(row[h])).join(";"))].join("\n");
}

async function toExcel(rows: Record<string, unknown>[], sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  if (rows.length) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    sheet.addRows(rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  let supabase;
  try {
    ({ supabase } = await requireAdmin());
  } catch (error) {
    if (error instanceof Error && error.message === "Accès refusé") {
      return new Response("Accès refusé", { status: 403 });
    }
    throw error;
  }
  const { resource } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const employeeId = searchParams.get("employeeId");
  const serviceId = searchParams.get("serviceId");
  const vehicleTypeId = searchParams.get("vehicleTypeId");
  const paymentMethod = searchParams.get("paymentMethod");
  const categoryId = searchParams.get("categoryId");
  const nature = searchParams.get("nature");

  let rows: Record<string, unknown>[] = [];

  if (resource === "washes") {
    let query = supabase
      .from("washes")
      .select("business_date, plate, final_amount, payment_method, status, customer_name")
      .gte("business_date", from ?? "2000-01-01")
      .lte("business_date", to ?? "2100-01-01");
    if (vehicleTypeId) query = query.eq("vehicle_type_id", vehicleTypeId);
    if (paymentMethod === "cash" || paymentMethod === "mobile_money") {
      query = query.eq("payment_method", paymentMethod);
    }
    if (employeeId) {
      const { data: links } = await supabase.from("wash_employees").select("wash_id").eq("employee_id", employeeId);
      const ids = (links ?? []).map((row) => row.wash_id);
      query = ids.length ? query.in("id", ids) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
    if (serviceId) {
      const { data: links } = await supabase.from("wash_services").select("wash_id").eq("service_id", serviceId);
      const ids = (links ?? []).map((row) => row.wash_id);
      query = ids.length ? query.in("id", ids) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { data } = await query;
    rows = data ?? [];
  } else if (resource === "expenses") {
    let query = supabase
      .from("expenses")
      .select("date, description, amount, nature, payment_method, status")
      .gte("date", from ?? "2000-01-01")
      .lte("date", to ?? "2100-01-01");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (nature === "FIXE" || nature === "VARIABLE") query = query.eq("nature", nature);
    const { data } = await query;
    rows = data ?? [];
  } else if (resource === "salaries") {
    const { data } = await supabase
      .from("salary_payments")
      .select("period_month, expected_amount, paid_amount, status, comment, employees(first_name, last_name)");
    rows = (data ?? []).map((row) => ({
      period_month: row.period_month,
      employee: `${(row.employees as { first_name: string; last_name: string } | null)?.first_name ?? ""} ${(row.employees as { first_name: string; last_name: string } | null)?.last_name ?? ""}`,
      expected_amount: row.expected_amount,
      paid_amount: row.paid_amount,
      status: row.status,
      comment: row.comment,
    }));
  } else if (resource === "employees") {
    const { data } = await supabase.from("employees").select("first_name, last_name, phone, monthly_salary, is_active");
    rows = data ?? [];
  } else if (resource === "finance") {
    const { data } = await supabase.rpc("dashboard_kpis", {
      p_from: from ?? "2000-01-01",
      p_to: to ?? "2100-01-01",
    });
    rows = data ?? [];
  } else {
    return new Response("Ressource inconnue", { status: 404 });
  }

  if (format === "xlsx") {
    const buffer = await toExcel(rows, resource);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${resource}.xlsx"`,
      },
    });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resource}.csv"`,
    },
  });
}
