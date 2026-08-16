"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWashAction, lookupPlateAction } from "@/lib/actions/washes";
import { DISCOUNT_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatGNF, toAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VehicleType = { id: string; name: string };
type Service = {
  id: string;
  name: string;
  is_active: boolean;
  service_prices: { vehicle_type_id: string; price: number | string }[];
};
type Employee = { id: string; first_name: string; last_name: string; is_active: boolean };

export function WashForm({
  vehicleTypes,
  services,
  employees,
}: {
  vehicleTypes: VehicleType[];
  services: Service[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [vehicleTypeId, setVehicleTypeId] = useState(vehicleTypes[0]?.id ?? "");
  const [plate, setPlate] = useState("");
  const [matches, setMatches] = useState<
    { plate: string; vehicle_type_id: string | null; customers: { name: string | null; phone: string | null } | null }[]
  >([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">("cash");
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ id: string } | null>(null);

  const theoretical = useMemo(() => {
    return serviceIds.reduce((sum, id) => {
      const service = services.find((s) => s.id === id);
      const price = service?.service_prices.find((p) => p.vehicle_type_id === vehicleTypeId)?.price;
      return sum + toAmount(price);
    }, 0);
  }, [serviceIds, services, vehicleTypeId]);

  const amount = finalAmount ?? theoretical;

  async function onPlateChange(value: string) {
    setPlate(value.toUpperCase());
    if (value.trim().length < 2) {
      setMatches([]);
      return;
    }
    const found = await lookupPlateAction(value);
    setMatches(
      (found ?? []).map((row) => ({
        plate: row.plate,
        vehicle_type_id: row.vehicle_type_id,
        customers: Array.isArray(row.customers) ? row.customers[0] ?? null : row.customers,
      })),
    );
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function submit() {
    startTransition(async () => {
      const result = await createWashAction({
        vehicleTypeId,
        plate,
        serviceIds,
        employeeIds,
        paymentMethod,
        theoreticalAmount: theoretical,
        finalAmount: amount,
        discountReason: theoretical === amount ? null : discountReason || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        note: note || null,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("id" in result && result.id) {
        toast.success("Lavage enregistré avec succès");
        setDone({ id: result.id });
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <p className="text-lg font-semibold">Lavage enregistré avec succès</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            className="h-11"
            onClick={() => {
              setDone(null);
              setPlate("");
              setServiceIds([]);
              setEmployeeIds([]);
              setFinalAmount(null);
              setCustomerName("");
              setCustomerPhone("");
              setNote("");
            }}
          >
            Nouveau lavage
          </Button>
          <Button variant="outline" className="h-11" onClick={() => router.push(`/washes/${done.id}`)}>
            Voir la transaction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Date et heure : {formatDateTime(new Date())} (Guinée)
      </p>
      <section className="space-y-2">
        <Label>Type de véhicule</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {vehicleTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setVehicleTypeId(type.id)}
              className={cn(
                "min-h-12 rounded-xl px-3 text-sm font-medium ring-1 transition-colors",
                vehicleTypeId === type.id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card ring-foreground/10 hover:bg-muted",
              )}
            >
              {type.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="plate">Plaque</Label>
        <Input
          id="plate"
          value={plate}
          onChange={(e) => void onPlateChange(e.target.value)}
          className="h-12 text-lg uppercase"
          autoComplete="off"
        />
        {matches.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            {matches.map((match) => (
              <button
                key={match.plate}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  setPlate(match.plate);
                  if (match.vehicle_type_id) setVehicleTypeId(match.vehicle_type_id);
                  setCustomerName(match.customers?.name ?? "");
                  setCustomerPhone(match.customers?.phone ?? "");
                  setMatches([]);
                }}
              >
                <span className="font-medium">{match.plate}</span>
                <span className="text-xs text-muted-foreground">
                  {match.customers?.name ?? "Véhicule connu"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <Label>Prestations</Label>
        <div className="space-y-2">
          {services
            .filter((s) => s.is_active)
            .map((service) => {
              const price = toAmount(
                service.service_prices.find((p) => p.vehicle_type_id === vehicleTypeId)?.price,
              );
              const selected = serviceIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setServiceIds((curr) => toggle(curr, service.id));
                    setFinalAmount(null);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-xl px-4 text-left ring-1",
                    selected ? "bg-accent ring-primary" : "bg-card ring-foreground/10",
                  )}
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="tabular-amount text-sm">{formatGNF(price)}</span>
                </button>
              );
            })}
        </div>
      </section>

      <section className="space-y-2">
        <Label>Employés</Label>
        <div className="flex flex-wrap gap-2">
          {employees
            .filter((e) => e.is_active)
            .map((employee) => {
              const selected = employeeIds.includes(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setEmployeeIds((curr) => toggle(curr, employee.id))}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm ring-1",
                    selected ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10",
                  )}
                >
                  {employee.first_name} {employee.last_name}
                </button>
              );
            })}
        </div>
      </section>

      <section className="space-y-2">
        <Label>Paiement</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "mobile_money"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "min-h-14 rounded-xl text-sm font-medium ring-1",
                paymentMethod === method
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card ring-foreground/10",
              )}
            >
              {PAYMENT_LABELS[method]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="amount">Montant encaissé</Label>
        <p className="text-xs text-muted-foreground">Théorique : {formatGNF(theoretical)}</p>
        <Input
          id="amount"
          inputMode="numeric"
          className="h-12 tabular-amount text-lg"
          value={amount}
          onChange={(e) => setFinalAmount(toAmount(e.target.value.replace(/\s/g, "")))}
        />
        {amount !== theoretical ? (
          <div className="space-y-2">
            <Label>Motif de la différence</Label>
            <select
              className="h-11 w-full rounded-lg border bg-transparent px-3"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
            >
              <option value="">Choisir</option>
              {Object.entries(DISCOUNT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Client (facultatif)</Label>
          <Input id="customerName" className="h-11" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Téléphone (facultatif)</Label>
          <Input
            id="customerPhone"
            className="h-11"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button className="h-12 w-full text-base" onClick={submit} disabled={pending}>
        {pending ? "Enregistrement…" : `Encaisser ${formatGNF(amount)}`}
      </Button>
    </div>
  );
}
