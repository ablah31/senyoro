"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertVehicleTypeAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VehicleTypeNameField({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const savedRef = useRef(name);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = value.trim();
    if (next === savedRef.current) return;
    if (next.length < 2) {
      setValue(savedRef.current);
      toast.error("Nom trop court");
      return;
    }
    startTransition(async () => {
      const result = await upsertVehicleTypeAction({ id, name: next });
      if (result.error) {
        toast.error(result.error);
        setValue(savedRef.current);
        return;
      }
      savedRef.current = next;
      setValue(next);
    });
  }

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      aria-label={`Type de véhicule ${name}`}
      autoComplete="off"
      disabled={pending}
      className="h-11"
    />
  );
}

export function VehicleTypesEditor({ types }: { types: { id: string; name: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div>
        <h2 className="font-semibold">Types de véhicules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Touchez un nom pour le changer. C&apos;est enregistré tout seul.
        </p>
      </div>
      {types.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {types.map((type) => (
            <li key={type.id}>
              <VehicleTypeNameField id={type.id} name={type.name} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun type pour l&apos;instant.</p>
      )}
      <form
        ref={formRef}
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const name = String(new FormData(form).get("name") ?? "").trim();
          if (name.length < 2) {
            toast.error("Nom trop court");
            return;
          }
          startTransition(async () => {
            const result = await upsertVehicleTypeAction({ name });
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Type ajouté. Ajustez les tarifs si besoin.");
            form.reset();
            router.refresh();
          });
        }}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="new-vehicle-type" className="sr-only">
            Nouveau type de véhicule
          </Label>
          <Input
            id="new-vehicle-type"
            name="name"
            placeholder="Nouveau type, ex. Camion"
            autoComplete="off"
            required
            minLength={2}
            className="h-11"
          />
        </div>
        <Button type="submit" className="h-11 sm:w-auto" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </Button>
      </form>
    </section>
  );
}
