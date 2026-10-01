import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Clients" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await requireClient();
  const needle = q?.replace(/[%(),]/g, "").trim();
  let query = supabase
    .from("customers")
    .select("id, name, phone, created_at")
    .order("created_at", { ascending: false });
  if (needle) query = query.or(`name.ilike.%${needle}%,phone.ilike.%${needle}%`);

  const [{ data }, { data: washRows }] = await Promise.all([
    query,
    supabase.from("washes").select("customer_id, occurred_at").eq("status", "active").limit(10000),
  ]);

  const stats = new Map<string, { visitCount: number; lastVisit: string | null }>();
  for (const wash of washRows ?? []) {
    if (!wash.customer_id) continue;
    const current = stats.get(wash.customer_id) ?? { visitCount: 0, lastVisit: null };
    current.visitCount += 1;
    if (!current.lastVisit || wash.occurred_at > current.lastVisit) {
      current.lastVisit = wash.occurred_at;
    }
    stats.set(wash.customer_id, current);
  }

  const customers = (data ?? [])
    .map((customer) => ({
      ...customer,
      visitCount: stats.get(customer.id)?.visitCount ?? 0,
      lastVisit: stats.get(customer.id)?.lastVisit ?? null,
    }))
    .toSorted((a, b) => {
      if (a.lastVisit && b.lastVisit) return a.lastVisit < b.lastVisit ? 1 : -1;
      if (a.lastVisit) return -1;
      if (b.lastVisit) return 1;
      return a.created_at < b.created_at ? 1 : -1;
    });

  return (
    <div className="space-y-4">
      <PageHeader title="Clients" description="Fiches créées automatiquement depuis un lavage.">
        <Button className="h-11 px-4" nativeButton={false} render={<Link href="/customers/whatsapp" />}>
          <MessageCircle aria-hidden />
          Message WhatsApp
        </Button>
      </PageHeader>
      <form>
        <Input name="q" defaultValue={q} placeholder="Nom ou téléphone" className="h-11" />
      </form>
      {customers.length === 0 ? (
        <EmptyState title="Aucun client pour le moment." />
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <p className="font-medium">{customer.name ?? "Client"}</p>
              <p className="text-sm text-muted-foreground">
                {customer.phone ?? "Sans téléphone"}
                {" · "}
                {customer.visitCount > 1
                  ? `${customer.visitCount} visites`
                  : customer.visitCount === 1
                    ? "1 visite"
                    : "Aucune visite"}
                {customer.lastVisit ? ` · ${formatDate(customer.lastVisit)}` : ` · depuis ${formatDate(customer.created_at)}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
