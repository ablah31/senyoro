"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteServiceAction, toggleServiceAction, upsertServiceAction, upsertVehicleTypeAction } from "@/lib/actions/admin";
import { formatGNF } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Service = {
  id: string;
  name: string;
  description: string | null;
  reference_price: number;
  is_active: boolean;
  service_prices: { vehicle_type_id: string; price: number }[];
};

export function CatalogManager({
  services,
  vehicleTypes,
}: {
  services: Service[];
  vehicleTypes: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <form
        className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(async () => {
            const prices = vehicleTypes.map((type) => ({
              vehicleTypeId: type.id,
              price: Number(form.get(`price-${type.id}`) || 0),
            }));
            const result = await upsertServiceAction({
              name: String(form.get("name")),
              description: String(form.get("description") || "") || null,
              referencePrice: Number(form.get("referencePrice") || 0),
              prices,
            });
            if (result.error) toast.error(result.error);
            else toast.success("Prestation enregistrée");
          });
        }}
      >
        <p className="font-semibold">Nouvelle prestation</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input name="name" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Prix de référence</Label>
            <Input name="referencePrice" inputMode="numeric" className="h-11" />
          </div>
        </div>
        <Input name="description" placeholder="Description facultative" className="h-11" />
        <div className="grid gap-2 sm:grid-cols-2">
          {vehicleTypes.map((type) => (
            <div key={type.id} className="space-y-1">
              <Label>{type.name}</Label>
              <Input name={`price-${type.id}`} inputMode="numeric" className="h-11" />
            </div>
          ))}
        </div>
        <Button className="h-11" disabled={pending}>
          Créer
        </Button>
      </form>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="min-w-0 overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{service.name}</p>
                <p className="truncate text-sm text-muted-foreground">Réf. {formatGNF(service.reference_price)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleServiceAction(service.id, !service.is_active)}>
                  {service.is_active ? "Désactiver" : "Activer"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteServiceAction(service.id)}>
                  Supprimer
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
              {vehicleTypes.map((type) => {
                const price = service.service_prices.find((p) => p.vehicle_type_id === type.id)?.price;
                return (
                  <p key={type.id} className="min-w-0 truncate">
                    {type.name}: {formatGNF(price)}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(async () => {
            const name = String(form.get("name"));
            const result = await upsertVehicleTypeAction({ name, slug: name });
            if (result.error) toast.error(result.error);
            else toast.success("Type de véhicule ajouté");
          });
        }}
      >
        <Input name="name" placeholder="Nouveau type de véhicule" className="h-11" />
        <Button className="h-11">Ajouter</Button>
      </form>
    </div>
  );
}
