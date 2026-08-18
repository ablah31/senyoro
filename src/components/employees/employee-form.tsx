"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleEmployeeAction, upsertEmployeeAction } from "@/lib/actions/admin";
import { uploadHint, uploadToBucket } from "@/lib/client-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EmployeeForm({
  roles,
  employee,
}: {
  roles: { id: string; name: string }[];
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    role_id: string | null;
    monthly_salary: number;
    hired_at: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    photo_url: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(employee?.photo_url ?? "");

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await upsertEmployeeAction({
            id: employee?.id,
            firstName: String(form.get("firstName")),
            lastName: String(form.get("lastName")),
            phone: String(form.get("phone") || "") || null,
            roleId: String(form.get("roleId") || "") || null,
            monthlySalary: Number(form.get("monthlySalary") || 0),
            hiredAt: String(form.get("hiredAt") || "") || null,
            address: String(form.get("address") || "") || null,
            notes: String(form.get("notes") || "") || null,
            photoUrl: photoUrl || null,
          });
          if (result.error) toast.error(result.error);
          else toast.success("Employé enregistré");
        });
      }}
    >
      <div className="space-y-2">
        <Label>Prénom</Label>
        <Input name="firstName" required className="h-11" defaultValue={employee?.first_name} />
      </div>
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input name="lastName" required className="h-11" defaultValue={employee?.last_name} />
      </div>
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input name="phone" className="h-11" defaultValue={employee?.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label>Fonction</Label>
        <select name="roleId" className="h-11 w-full rounded-lg border bg-transparent px-3" defaultValue={employee?.role_id ?? ""}>
          <option value="">—</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Salaire mensuel de référence</Label>
        <Input name="monthlySalary" inputMode="numeric" className="h-11" defaultValue={employee?.monthly_salary ?? 0} />
      </div>
      <div className="space-y-2">
        <Label>Date d'embauche</Label>
        <Input name="hiredAt" type="date" className="h-11" defaultValue={employee?.hired_at ?? ""} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Adresse</Label>
        <Input name="address" className="h-11" defaultValue={employee?.address ?? ""} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Photo</Label>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="size-16 rounded-full object-cover" />
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
                const uploaded = await uploadToBucket("employee-photos", file);
                setPhotoUrl(uploaded.publicUrl);
                toast.success("Photo importée");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Import impossible");
              }
            });
          }}
        />
        <p className="text-xs text-muted-foreground">{uploadHint("employee-photos")}</p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" defaultValue={employee?.notes ?? ""} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" className="h-11" disabled={pending}>
          Enregistrer
        </Button>
        {employee ? (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => toggleEmployeeAction(employee.id, !employee.is_active)}
          >
            {employee.is_active ? "Désactiver" : "Réactiver"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
