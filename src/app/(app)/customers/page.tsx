import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { formatGNF } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Clients" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await requireClient();
  let query = supabase.from("customers").select("id, name, phone, created_at").order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query.limit(100);

  return (
    <div className="space-y-4">
      <PageHeader title="Clients" description="Fiches créées automatiquement depuis un lavage." />
      <form>
        <Input name="q" defaultValue={q} placeholder="Nom ou téléphone" className="h-11" />
      </form>
      {(data ?? []).length === 0 ? (
        <EmptyState title="Aucun client pour le moment." />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <p className="font-medium">{customer.name ?? "Client"}</p>
              <p className="text-sm text-muted-foreground">
                {customer.phone ?? "Sans téléphone"} · depuis {formatDate(customer.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
