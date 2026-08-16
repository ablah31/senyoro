"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginAction(formData),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required className="h-11" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
