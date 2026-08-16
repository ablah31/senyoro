import { getCashDay, getOrganization } from "@/lib/queries";
import { businessDate } from "@/lib/dates";
import { formatGNF, toAmount } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { CashForms } from "@/components/cash/cash-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Caisse" };

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? businessDate();
  const [summary, org] = await Promise.all([getCashDay(date), getOrganization()]);

  const closed = Boolean(summary?.closed_at);
  const theoreticalCash = toAmount(summary?.theoretical_cash);
  const theoreticalMm = toAmount(summary?.theoretical_mobile);

  return (
    <div className="space-y-6">
      <PageHeader title="Caisse" description={`Journée du ${date}`}>
        {!closed ? <Badge variant="outline">Caisse non clôturée</Badge> : <Badge>Clôturée</Badge>}
      </PageHeader>
      <p className="text-sm text-muted-foreground">
        Les espèces et le Mobile Money sont suivis séparément. Résultat de gestion interne, non certifié.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Espèces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Fond initial" value={summary?.opening_cash} />
            <Row label="Encaissements" value={summary?.cash_in} />
            <Row label="Dépenses" value={summary?.cash_out} />
            <Row label="Théorique" value={theoreticalCash} strong />
            {summary?.counted_cash != null ? (
              <>
                <Row label="Réel" value={summary.counted_cash} />
                <Row label="Écart" value={summary.cash_diff} />
              </>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mobile Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Solde initial" value={summary?.opening_mobile_money} />
            <Row label="Encaissements" value={summary?.mobile_in} />
            <Row label="Dépenses" value={summary?.mobile_out} />
            <Row label="Théorique" value={theoreticalMm} strong />
            {summary?.counted_mobile_money != null ? (
              <>
                <Row label="Réel" value={summary.counted_mobile_money} />
                <Row label="Écart" value={summary.mobile_diff} />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <CashForms
        date={date}
        sessionId={summary?.session_id ?? null}
        defaultOpeningCash={toAmount(org.default_opening_cash)}
        closed={closed}
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | number | null | undefined;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "tabular-amount font-semibold" : "tabular-amount"}>{formatGNF(value)}</span>
    </div>
  );
}
