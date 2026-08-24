"use client";

import { useActionState, useEffect, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { upsertCategoryAction } from "@/lib/actions/expenses";
import {
  updateOrganizationFormAction,
  updateOrganizationLogoAction,
} from "@/lib/actions/admin";
import { uploadHint, uploadToBucket } from "@/lib/client-upload";
import { formatDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForms({
  organization,
  categories,
  vehicleTypes,
  serviceCount,
  logs,
}: {
  organization: {
    name: string;
    phone: string | null;
    address: string | null;
    currency: string;
    logo_url: string | null;
  };
  categories: { id: string; name: string; default_nature: "FIXE" | "VARIABLE"; is_system: boolean }[];
  vehicleTypes: { id: string; name: string }[];
  serviceCount: number;
  logs: { id: string; action: string; table_name: string; created_at: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [orgState, orgFormAction, orgPending] = useActionState(updateOrganizationFormAction, null);

  useEffect(() => {
    if (orgState?.error) toast.error(orgState.error);
    if (orgState?.success) toast.success("Paramètres enregistrés");
  }, [orgState]);

  return (
    <div className="space-y-8">
      <form
        action={orgFormAction}
        className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:grid-cols-2"
      >
        <div className="space-y-2 md:col-span-2">
          <Label>Nom du centre</Label>
          <Input name="name" defaultValue={organization.name} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input name="phone" defaultValue={organization.phone ?? ""} className="h-11" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Adresse</Label>
          <Input name="address" defaultValue={organization.address ?? ""} className="h-11" />
        </div>
        <p className="text-sm text-muted-foreground md:col-span-2">Devise : {organization.currency}</p>
        <div className="space-y-2 md:col-span-2">
          <Label>Logo</Label>
          {organization.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logo_url} alt="" className="h-12 w-auto rounded-md object-contain" />
          ) : null}
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-11"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              startTransition(async () => {
                try {
                  const uploaded = await uploadToBucket("organization-logos", file);
                  const result = await updateOrganizationLogoAction(uploaded.publicUrl);
                  if (result?.error) toast.error(result.error);
                  else toast.success("Logo mis à jour");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Import impossible");
                }
              });
            }}
          />
          <p className="text-xs text-muted-foreground">{uploadHint("organization-logos")}</p>
        </div>
        <Button type="submit" className="h-11" disabled={pending || orgPending}>
          Enregistrer
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Catégories de dépenses</h2>
        {categories.map((category) => (
          <form
            key={category.id}
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              void upsertCategoryAction({
                id: category.id,
                name: String(form.get("name")),
                defaultNature: String(form.get("defaultNature")),
              });
            }}
          >
            <Input name="name" defaultValue={category.name} className="h-11" disabled={category.is_system} />
            <select name="defaultNature" defaultValue={category.default_nature} className="h-11 rounded-lg border px-2">
              <option value="FIXE">Fixe</option>
              <option value="VARIABLE">Variable</option>
            </select>
            <Button type="submit" variant="outline">
              OK
            </Button>
          </form>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void upsertCategoryAction({
              name: String(form.get("name")),
              defaultNature: "VARIABLE",
            });
          }}
        >
          <Input name="name" placeholder="Nouvelle catégorie" className="h-11" />
          <Button type="submit">Ajouter</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Types de véhicules</h2>
        <p className="text-sm text-muted-foreground">
          {vehicleTypes.length} types · {serviceCount} prestations. Pour ajouter, renommer ou changer un tarif,
          ouvrez Prestations.
        </p>
        <Button variant="outline" className="h-11 w-fit" nativeButton={false} render={<Link href="/services" />}>
          Ouvrir Prestations
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Journal d&apos;activité</h2>
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
            {formatDateTime(log.created_at)} · {log.action} · {log.table_name}
          </div>
        ))}
      </section>
    </div>
  );
}
