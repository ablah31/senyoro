"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: string } | null, formData: FormData) =>
      forgotPasswordAction(formData),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state?.success ? <p className="text-sm text-[var(--success)]">{state.success}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            Envoyer le lien
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
