"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteServiceAction,
  toggleServiceAction,
  updateServiceNameAction,
  updateServicePriceAction,
} from "@/lib/actions/admin";
import { parsePriceInput, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VehicleType = { id: string; name: string };

function PriceField({
  serviceId,
  serviceName,
  vehicleType,
  initialPrice,
}: {
  serviceId: string;
  serviceName: string;
  vehicleType: VehicleType;
  initialPrice: number;
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
      const result = await updateServicePriceAction({
        serviceId,
        vehicleTypeId: vehicleType.id,
        price: next,
      });
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
      <Label htmlFor={`price-${serviceId}-${vehicleType.id}`}>{vehicleType.name}</Label>
      <div className="relative">
        <Input
          id={`price-${serviceId}-${vehicleType.id}`}
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
          disabled={pending}
          aria-label={`${serviceName}, ${vehicleType.name}`}
          className="h-11 pr-12 tabular-amount"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          GNF
        </span>
      </div>
    </div>
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
    service_prices: { vehicle_type_id: string; price: number | string }[];
  };
  vehicleTypes: VehicleType[];
}) {
  const router = useRouter();
  const [name, setName] = useState(service.name);
  const savedName = useRef(service.name);
  const [pending, startTransition] = useTransition();

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
      {vehicleTypes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicleTypes.map((type) => (
            <PriceField
              key={type.id}
              serviceId={service.id}
              serviceName={name}
              vehicleType={type}
              initialPrice={toAmount(
                service.service_prices.find((price) => price.vehicle_type_id === type.id)?.price,
              )}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ajoutez un type de véhicule pour saisir les tarifs.</p>
      )}
    </article>
  );
}
