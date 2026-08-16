"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => updatePasswordAction(formData),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required minLength={8} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmation</Label>
            <Input id="confirm" name="confirm" type="password" required minLength={8} className="h-11" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
