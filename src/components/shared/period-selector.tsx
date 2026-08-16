"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const period = (params.get("period") as PeriodKey) || "today";

  function setPeriod(next: PeriodKey) {
    const search = new URLSearchParams(params.toString());
    search.set("period", next);
    if (next !== "custom") {
      search.delete("from");
      search.delete("to");
    }
    router.push(`${pathname}?${search.toString()}`);
  }

  function setCustom(key: "from" | "to", value: string) {
    const search = new URLSearchParams(params.toString());
    search.set("period", "custom");
    search.set(key, value);
    router.push(`${pathname}?${search.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-sm transition-colors",
              period === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            className="h-11"
            value={params.get("from") ?? ""}
            onChange={(e) => setCustom("from", e.target.value)}
          />
          <Input
            type="date"
            className="h-11"
            value={params.get("to") ?? ""}
            onChange={(e) => setCustom("to", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
