"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWashAction, updateWashAction } from "@/lib/actions/washes";
import { DISCOUNT_LABELS, PAYMENT_LABELS } from "@/lib/constants";
import { formatGNF, toAmount } from "@/lib/format";
import { priceForVehicle } from "@/lib/service-price";
import { businessDate, formatDateTime } from "@/lib/dates";
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
  reference_price: number | string;
  service_prices: { vehicle_type_id: string; price: number | string }[];
};
type Employee = { id: string; first_name: string; last_name: string; is_active: boolean };
export type CustomerMatch = {
  id: string;
  name: string | null;
  phone: string | null;
  vehicles?: { plate: string; vehicle_type_id: string | null }[];
};

function filterCustomerMatches(customers: CustomerMatch[], query: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const isPhoneQuery = digits.length >= 2;
  const needle = q.toLowerCase();
  const matches: CustomerMatch[] = [];
  for (const customer of customers) {
    if (matches.length >= 8) break;
    if (isPhoneQuery) {
      const phone = (customer.phone ?? "").replace(/\D/g, "");
      if (phone.includes(digits)) matches.push(customer);
    } else if ((customer.name ?? "").toLowerCase().includes(needle)) {
      matches.push(customer);
    }
  }
  return matches;
}

export type WashFormValues = {
  id: string;
  vehicleTypeId: string;
  serviceIds: string[];
  employeeIds: string[];
  paymentMethod: "cash" | "mobile_money";
  finalAmount: number;
  discountReason: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  note: string | null;
  occurredAt: string;
};

function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 space-y-3 overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </section>
  );
}

export function WashForm({
  vehicleTypes,
  services,
  employees,
  customers = [],
  wash,
}: {
  vehicleTypes: VehicleType[];
  services: Service[];
  employees: Employee[];
  customers?: CustomerMatch[];
  wash?: WashFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(wash);
  const [pending, startTransition] = useTransition();
  const [vehicleTypeId, setVehicleTypeId] = useState(wash?.vehicleTypeId ?? vehicleTypes[0]?.id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>(wash?.serviceIds ?? []);
  const [employeeIds, setEmployeeIds] = useState<string[]>(wash?.employeeIds ?? []);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money">(wash?.paymentMethod ?? "cash");
  const [finalAmount, setFinalAmount] = useState<number | null>(wash ? wash.finalAmount : null);
  const [discountReason, setDiscountReason] = useState(wash?.discountReason ?? "");
  const [customerId, setCustomerId] = useState<string | null>(wash?.customerId ?? null);
  const [customerName, setCustomerName] = useState(wash?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(wash?.customerPhone ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [note, setNote] = useState(wash?.note ?? "");
  const [washDate, setWashDate] = useState(() => businessDate());
  const [done, setDone] = useState<{ id: string } | null>(null);

  const theoretical = useMemo(() => {
    return serviceIds.reduce((sum, id) => {
      const service = services.find((s) => s.id === id);
      return sum + priceForVehicle(service, vehicleTypeId);
    }, 0);
  }, [serviceIds, services, vehicleTypeId]);

  const amount = finalAmount ?? theoretical;
  const customerMatches = customerId ? [] : filterCustomerMatches(customers, customerSearch);

  function onCustomerQuery(value: string, field: "name" | "phone") {
    if (field === "name") setCustomerName(value);
    else setCustomerPhone(value);
    setCustomerId(null);
    setCustomerSearch(value);
  }

  function selectCustomer(match: CustomerMatch) {
    setCustomerId(match.id);
    setCustomerName(match.name ?? "");
    setCustomerPhone(match.phone ?? "");
    setCustomerSearch("");
    const vehicleType = match.vehicles?.[0]?.vehicle_type_id;
    if (vehicleType) setVehicleTypeId(vehicleType);
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function resetForm() {
    setDone(null);
    setCustomerSearch("");
    setServiceIds([]);
    setEmployeeIds([]);
    setFinalAmount(null);
    setDiscountReason("");
    setCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setWashDate(businessDate());
  }

  function submit() {
    if (pending) return;
    if (serviceIds.length === 0) {
      toast.error("Choisissez au moins une prestation");
      return;
    }
    if (employeeIds.length === 0) {
      toast.error("Choisissez au moins un employé");
      return;
    }
    if (amount !== theoretical && !discountReason) {
      toast.error("Indiquez le motif de la différence de prix");
      return;
    }
    if (!isEdit && washDate > businessDate()) {
      toast.error("La date du lavage ne peut pas être dans le futur");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          vehicleTypeId,
          serviceIds,
          employeeIds,
          paymentMethod,
          theoreticalAmount: theoretical,
          finalAmount: amount,
          discountReason: theoretical === amount ? null : discountReason || null,
          customerId,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          note: note || null,
        };
        const result = wash
          ? await updateWashAction({ ...payload, id: wash.id })
          : await createWashAction({ ...payload, businessDate: washDate });
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        if ("id" in result && result.id) {
          if (wash) {
            toast.success("Lavage mis à jour");
            setTimeout(() => {
              router.push(`/washes/${result.id}`);
            }, 0);
            return;
          }
          toast.success("Lavage enregistré avec succès");
          setDone({ id: result.id });
        } else {
          toast.error("Enregistrement impossible");
        }
      } catch {
        toast.error("Enregistrement impossible. Réessayez.");
      }
    });
  }

  if (done) {
    return (
      <div className="overflow-hidden rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <p className="text-lg font-semibold">Lavage enregistré avec succès</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="h-11" onClick={resetForm}>
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
    <div className="relative min-w-0" aria-busy={pending}>
      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-8 py-6 ring-1 ring-foreground/10">
            <span
              className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
              role="status"
              aria-label="Enregistrement en cours"
            />
            <p className="text-sm font-medium">
              {isEdit ? "Enregistrement…" : "Enregistrement du lavage…"}
            </p>
          </div>
        </div>
      ) : null}
    <div className={cn("min-w-0 space-y-4", pending && "pointer-events-none")}>
      {wash ? (
        <p className="text-sm text-muted-foreground">
          Date et heure : {formatDateTime(new Date(wash.occurredAt))} (Guinée)
        </p>
      ) : (
        <FormSection title="Date du lavage">
          <Label htmlFor="washDate" className="sr-only">
            Date du lavage
          </Label>
          <Input
            id="washDate"
            type="date"
            required
            className="h-12"
            value={washDate}
            max={businessDate()}
            onChange={(e) => setWashDate(e.target.value)}
          />
        </FormSection>
      )}

      <FormSection title="Type de véhicule">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {vehicleTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setVehicleTypeId(type.id)}
              className={cn(
                "min-h-12 min-w-0 truncate rounded-xl px-3 text-sm font-medium ring-1 transition-colors",
                vehicleTypeId === type.id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted",
              )}
            >
              {type.name}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Prestations">
        <div className="space-y-2">
          {services
            .filter((s) => s.is_active || serviceIds.includes(s.id))
            .map((service) => {
              const price = priceForVehicle(service, vehicleTypeId);
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
                    "flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-xl px-4 text-left ring-1",
                    selected ? "bg-accent ring-primary" : "bg-background ring-foreground/10",
                  )}
                >
                  <span className="min-w-0 truncate font-medium">{service.name}</span>
                  <span className="tabular-amount shrink-0 text-sm">{formatGNF(price)}</span>
                </button>
              );
            })}
        </div>
      </FormSection>

      <FormSection title="Employés">
        <div className="flex flex-wrap gap-2">
          {employees
            .filter((e) => e.is_active || employeeIds.includes(e.id))
            .map((employee) => {
              const selected = employeeIds.includes(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setEmployeeIds((curr) => toggle(curr, employee.id))}
                  className={cn(
                    "min-h-11 max-w-full truncate rounded-full px-4 text-sm ring-1",
                    selected ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-foreground/10",
                  )}
                >
                  {employee.first_name} {employee.last_name}
                </button>
              );
            })}
        </div>
      </FormSection>

      <FormSection title="Paiement">
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "mobile_money"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "min-h-14 min-w-0 truncate rounded-xl text-sm font-medium ring-1",
                paymentMethod === method
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10",
              )}
            >
              {PAYMENT_LABELS[method]}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Montant encaissé">
        <p className="text-xs text-muted-foreground">Théorique : {formatGNF(theoretical)}</p>
        <Label htmlFor="amount" className="sr-only">
          Montant encaissé
        </Label>
        <Input
          id="amount"
          inputMode="numeric"
          className="h-12 tabular-amount text-lg"
          value={amount}
          onChange={(e) => setFinalAmount(toAmount(e.target.value.replace(/\s/g, "")))}
        />
        {amount !== theoretical ? (
          <div className="space-y-2">
            <Label htmlFor="discountReason">Motif de la différence</Label>
            <select
              id="discountReason"
              className="h-11 w-full min-w-0 rounded-lg border bg-transparent px-3"
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
      </FormSection>

      <FormSection title="Client (facultatif)">
        <p className="text-xs text-muted-foreground">
          Saisissez un nom ou un téléphone pour retrouver un client existant, ou créez-en un nouveau.
        </p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="customerName">Nom</Label>
            <Input
              id="customerName"
              className="h-11"
              value={customerName}
              autoComplete="off"
              onChange={(e) => onCustomerQuery(e.target.value, "name")}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="customerPhone">Téléphone</Label>
            <Input
              id="customerPhone"
              className="h-11"
              inputMode="tel"
              value={customerPhone}
              autoComplete="off"
              onChange={(e) => onCustomerQuery(e.target.value, "phone")}
            />
          </div>
        </div>
        {customerId ? (
          <p className="text-xs text-[var(--success)]">Client existant sélectionné</p>
        ) : null}
        {customerMatches.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-background">
            {customerMatches.map((match) => (
              <button
                key={match.id}
                type="button"
                className="flex w-full min-w-0 flex-col items-start px-3 py-2 text-left hover:bg-muted"
                onClick={() => selectCustomer(match)}
              >
                <span className="truncate font-medium">{match.name ?? "Client"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {match.phone ?? "Sans téléphone"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Note">
        <Label htmlFor="note" className="sr-only">
          Note
        </Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </FormSection>

      <Button className="h-12 w-full text-base" onClick={submit} disabled={pending}>
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Enregistrement…
          </span>
        ) : isEdit ? (
          `Enregistrer ${formatGNF(amount)}`
        ) : (
          `Encaisser ${formatGNF(amount)}`
        )}
      </Button>
    </div>
    </div>
  );
}
