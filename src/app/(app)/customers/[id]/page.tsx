import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { formatDateTime, formatDate } from "@/lib/dates";
import { formatGNF, toAmount } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await requireClient();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) notFound();

  const [{ data: vehicles }, { data: washes }] = await Promise.all([
    supabase.from("vehicles").select("*, vehicle_types(name)").eq("customer_id", id),
    supabase
      .from("washes")
      .select("id, occurred_at, plate, final_amount, status")
      .eq("customer_id", id)
      .order("occurred_at", { ascending: false }),
  ]);

  const total = (washes ?? [])
    .filter((w) => w.status === "active")
    .reduce((sum, w) => sum + toAmount(w.final_amount), 0);
  const lastVisit = washes?.[0]?.occurred_at;

  return (
    <div className="space-y-6">
      <PageHeader title={customer.name ?? "Client"} description={customer.phone ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Visites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{washes?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total dépensé</CardTitle>
          </CardHeader>
          <CardContent className="tabular-amount text-xl font-semibold">{formatGNF(total)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dernière visite</CardTitle>
          </CardHeader>
          <CardContent>{lastVisit ? formatDate(lastVisit) : "—"}</CardContent>
        </Card>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Véhicules</h2>
        <div className="space-y-2">
          {(vehicles ?? []).map((vehicle) => {
            const type = vehicle.vehicle_types as { name: string } | null;
            return (
              <div key={vehicle.id} className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
                {vehicle.plate} · {type?.name}
                {vehicle.brand ? ` · ${vehicle.brand} ${vehicle.model ?? ""}` : ""}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Historique</h2>
        <div className="space-y-2">
          {(washes ?? []).map((wash) => (
            <Link
              key={wash.id}
              href={`/washes/${wash.id}`}
              className="flex justify-between rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10"
            >
              <span>
                {formatDateTime(wash.occurred_at)} · {wash.plate}
              </span>
              <span className="tabular-amount">{formatGNF(wash.final_amount)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
