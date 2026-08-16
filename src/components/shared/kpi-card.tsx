import { formatPercent, toAmount } from "@/lib/format";
import { Amount } from "@/components/shared/amount";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  previous,
  isAmount = true,
}: {
  label: string;
  value: number;
  previous?: number;
  isAmount?: boolean;
}) {
  const variation =
    previous === undefined
      ? null
      : previous === 0
        ? value === 0
          ? 0
          : 100
        : ((value - previous) / previous) * 100;

  return (
    <Card>
      <CardContent className="px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight">
          {isAmount ? <Amount value={value} /> : toAmount(value)}
        </p>
        {variation !== null ? (
          <p
            className={cn(
              "mt-1 text-xs",
              variation >= 0 ? "text-[var(--success)]" : "text-destructive",
            )}
          >
            {formatPercent(variation)} vs période précédente
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
