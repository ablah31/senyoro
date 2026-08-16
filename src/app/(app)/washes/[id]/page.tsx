import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { DISCOUNT_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { formatGNF } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { CancelWashButton } from "@/components/washes/cancel-wash-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WashDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await requireClient();
  const { data: wash } = await supabase
    .from("washes")
    .select(
      "*, vehicle_types(name), wash_services(name, price), wash_employees(employees(first_name, last_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!wash) notFound();

  const vehicle = wash.vehicle_types as { name: string } | null;
  const services = (wash.wash_services as { name: string; price: number }[]) ?? [];
  const employees =
    (wash.wash_employees as { employees: { first_name: string; last_name: string } | null }[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={wash.plate ?? "Lavage"} description={formatDateTime(wash.occurred_at)}>
        <Badge variant={wash.status === "active" ? "secondary" : "destructive"}>
          {wash.status === "active" ? "Actif" : "Annulé"}
        </Badge>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Détail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Véhicule : {vehicle?.name}</p>
          <p>Client : {wash.customer_name ?? "—"} {wash.customer_phone ?? ""}</p>
          <p>Paiement : {PAYMENT_LABELS[wash.payment_method]}</p>
          <ul className="space-y-1">
            {services.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span className="tabular-amount">{formatGNF(s.price)}</span>
              </li>
            ))}
          </ul>
          <p>
            Théorique : <span className="tabular-amount">{formatGNF(wash.theoretical_amount)}</span>
          </p>
          <p className="text-base font-semibold">
            Encaissé : <span className="tabular-amount">{formatGNF(wash.final_amount)}</span>
          </p>
          {wash.discount_reason ? (
            <p>
              Écart : {DISCOUNT_LABELS[wash.discount_reason]} ({formatGNF(wash.discount_amount)})
            </p>
          ) : null}
          <p>
            Employés :{" "}
            {employees
              .map((row) => (row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : ""))
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
          {wash.note ? <p>Note : {wash.note}</p> : null}
          {wash.cancel_reason ? <p>Annulation : {wash.cancel_reason}</p> : null}
        </CardContent>
      </Card>
      {wash.status === "active" ? <CancelWashButton id={wash.id} /> : null}
    </div>
  );
}
