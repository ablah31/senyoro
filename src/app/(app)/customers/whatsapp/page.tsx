import Link from "next/link";
import { getCustomersWithPhone, getOrganization } from "@/lib/queries";
import {
  groupWhatsAppRecipients,
  NAME_PLACEHOLDER,
  type UnreachableCustomer,
} from "@/lib/whatsapp";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { WhatsAppBroadcast } from "@/components/customers/whatsapp-broadcast";

export const metadata = { title: "Message WhatsApp" };

function UnreachableCustomers({ customers }: { customers: UnreachableCustomer[] }) {
  const count = customers.length;
  return (
    <details className="mt-6 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <summary className="cursor-pointer text-sm font-medium">
        {count > 1 ? `${count} numéros à vérifier` : "1 numéro à vérifier"}
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">
        Ces numéros ne peuvent pas recevoir de message WhatsApp (fixe, incomplet ou mal saisi).
        Format attendu : 620 00 00 00 ou +224 620 00 00 00.
      </p>
      <ul className="mt-3 space-y-1">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link
              href={`/customers/${customer.id}`}
              className="flex justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted"
            >
              <span className="truncate">{customer.name ?? "Client"}</span>
              <span className="shrink-0 text-muted-foreground">{customer.phone}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default async function CustomersWhatsAppPage() {
  const [customers, organization] = await Promise.all([getCustomersWithPhone(), getOrganization()]);
  const { recipients, unreachable } = groupWhatsAppRecipients(customers);
  const defaultMessage = `Bonjour ${NAME_PLACEHOLDER}, c'est ${organization.name}. `;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Message WhatsApp"
        description="Écrivez le message une fois, puis envoyez-le à chaque client depuis votre WhatsApp."
      />
      {recipients.length === 0 ? (
        <EmptyState
          title="Aucun client avec un numéro WhatsApp."
          description="Saisissez le téléphone du client lors d'un lavage pour pouvoir lui écrire ici."
          actionLabel="Nouveau lavage"
          actionHref="/washes/new"
        />
      ) : (
        <WhatsAppBroadcast recipients={recipients} defaultMessage={defaultMessage} />
      )}
      {unreachable.length > 0 ? <UnreachableCustomers customers={unreachable} /> : null}
    </div>
  );
}
