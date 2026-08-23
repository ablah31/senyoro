"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  deleteServiceAction,
  toggleServiceAction,
  updateServiceGlobalPriceAction,
  updateServiceNameAction,
  updateServicePriceAction,
} from "@/lib/actions/admin";
import { parsePriceInput, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VehicleType = { id: string; name: string };
type ServicePrice = { vehicle_type_id: string; price: number | string };

function AmountField({
  id,
  label,
  ariaLabel,
  initialPrice,
  disabled,
  onSave,
}: {
  id: string;
  label: string;
  ariaLabel: string;
  initialPrice: number;
  disabled?: boolean;
  onSave: (price: number) => Promise<{ error?: string }>;
}) {
  const [value, setValue] = useState(() => String(initialPrice || ""));
  const savedRef = useRef(initialPrice);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = parsePriceInput(value);
    if (next === savedRef.current) {
      setValue(next ? String(next) : "");
      return;
    }
    startTransition(async () => {
      const result = await onSave(next);
      if (result.error) {
        toast.error(result.error);
        setValue(savedRef.current ? String(savedRef.current) : "");
        return;
      }
      savedRef.current = next;
      setValue(next ? String(next) : "");
    });
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || pending}
          aria-label={ariaLabel}
          className="h-11 pr-12 tabular-amount"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          GNF
        </span>
      </div>
    </div>
  );
}

function pricesByType(servicePrices: ServicePrice[], vehicleTypes: VehicleType[]) {
  return vehicleTypes.map((type) =>
    toAmount(servicePrices.find((price) => price.vehicle_type_id === type.id)?.price),
  );
}

export function ServicePriceCard({
  service,
  vehicleTypes,
}: {
  service: {
    id: string;
    name: string;
    is_active: boolean;
    reference_price: number | string;
    service_prices: ServicePrice[];
  };
  vehicleTypes: VehicleType[];
}) {
  const router = useRouter();
  const [name, setName] = useState(service.name);
  const savedName = useRef(service.name);
  const [pending, startTransition] = useTransition();
  const typedPrices = pricesByType(service.service_prices, vehicleTypes);
  const uniform = typedPrices.length > 0 && typedPrices.every((price) => price === typedPrices[0]);
  const [appliedPrice, setAppliedPrice] = useState<number | null>(uniform ? typedPrices[0] : null);
  const [priceStamp, setPriceStamp] = useState(0);

  function saveName() {
    const next = name.trim();
    if (next === savedName.current) return;
    if (next.length < 2) {
      setName(savedName.current);
      toast.error("Nom trop court");
      return;
    }
    startTransition(async () => {
      const result = await updateServiceNameAction({ id: service.id, name: next });
      if (result.error) {
        toast.error(result.error);
        setName(savedName.current);
        return;
      }
      savedName.current = next;
      setName(next);
    });
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        !service.is_active && "opacity-70",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`service-name-${service.id}`} className="sr-only">
            Nom de la prestation
          </Label>
          <Input
            id={`service-name-${service.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={saveName}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            autoComplete="off"
            disabled={pending}
            className="h-11 font-medium"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await toggleServiceAction(service.id, !service.is_active);
                if (result.error) toast.error(result.error);
                else router.refresh();
              })
            }
          >
            {service.is_active ? "Désactiver" : "Activer"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteServiceAction(service.id);
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Prestation supprimée");
                  router.refresh();
                }
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </div>

      <AmountField
        id={`global-price-${service.id}`}
        label="Tarif global"
        ariaLabel={`${name}, tarif global tous types`}
        initialPrice={appliedPrice ?? toAmount(service.reference_price)}
        disabled={pending}
        onSave={async (price) => {
          const result = await updateServiceGlobalPriceAction({ serviceId: service.id, price });
          if (!result.error) {
            setAppliedPrice(price);
            setPriceStamp((value) => value + 1);
          }
          return result;
        }}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Même prix pour tous les types. Ouvrez ci-dessous seulement si un type coûte plus cher.
        {!uniform && appliedPrice === null ? " Les tarifs par type sont différents aujourd'hui." : ""}
      </p>

      {vehicleTypes.length > 0 ? (
        <details className="group rounded-xl bg-background ring-1 ring-foreground/10 open:ring-foreground/15">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:hidden transition-colors hover:bg-muted/70 group-open:rounded-b-none [&::-webkit-details-marker]:hidden focus-visible:rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            Prix différents selon le type
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
            {vehicleTypes.map((type) => (
              <AmountField
                key={`${type.id}-${priceStamp}`}
                id={`price-${service.id}-${type.id}`}
                label={type.name}
                ariaLabel={`${name}, ${type.name}`}
                initialPrice={
                  appliedPrice ??
                  toAmount(service.service_prices.find((price) => price.vehicle_type_id === type.id)?.price)
                }
                disabled={pending}
                onSave={(price) =>
                  updateServicePriceAction({
                    serviceId: service.id,
                    vehicleTypeId: type.id,
                    price,
                  })
                }
              />
            ))}
          </div>
        </details>
      ) : (
        <p className="text-sm text-muted-foreground">Ajoutez un type de véhicule si certains tarifs doivent différer.</p>
      )}
    </article>
  );
}
