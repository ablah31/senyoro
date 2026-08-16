import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <p className="text-base font-semibold">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button className="mt-6 h-11 px-4" render={<Link href={actionHref} />}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
