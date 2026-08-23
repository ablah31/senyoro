"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertServiceAction } from "@/lib/actions/admin";
import { parsePriceInput } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServicePriceCard } from "@/components/services/service-price-card";
import { VehicleTypesEditor } from "@/components/services/vehicle-types-editor";

type Service = {
  id: string;
  name: string;
  is_active: boolean;
  reference_price: number | string;
  service_prices: { vehicle_type_id: string; price: number | string }[];
};

export function CatalogManager({
  services,
  vehicleTypes,
}: {
  services: Service[];
  vehicleTypes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <VehicleTypesEditor types={vehicleTypes} />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Tarifs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Touchez un montant, changez-le, puis touchez ailleurs. C&apos;est enregistré.
          </p>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune prestation pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map((service) => (
              <ServicePriceCard key={service.id} service={service} vehicleTypes={vehicleTypes} />
            ))}
          </div>
        )}
      </section>

      <form
        className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const name = String(data.get("name") ?? "").trim();
          const price = parsePriceInput(String(data.get("price") ?? ""));
          startTransition(async () => {
            const result = await upsertServiceAction({
              name,
              referencePrice: price,
              prices: vehicleTypes.map((type) => ({ vehicleTypeId: type.id, price })),
            });
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Prestation créée");
            form.reset();
            router.refresh();
          });
        }}
      >
        <p className="font-semibold">Nouvelle prestation</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
          <div className="space-y-1">
            <Label htmlFor="new-service-name">Nom</Label>
            <Input id="new-service-name" name="name" required minLength={2} autoComplete="off" className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-service-price">Prix</Label>
            <div className="relative">
              <Input
                id="new-service-price"
                name="price"
                inputMode="numeric"
                required
                autoComplete="off"
                className="h-11 pr-12 tabular-amount"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                GNF
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ce prix est copié sur tous les types. Ajustez ensuite chaque case si besoin.
        </p>
      </form>
    </div>
  );
}
