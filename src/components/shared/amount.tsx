import { formatGNF, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Amount({
  value,
  className,
  compact = false,
}: {
  value: string | number | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("tabular-amount", className)}>
      {compact ? formatNumber(value) : formatGNF(value)}
    </span>
  );
}
