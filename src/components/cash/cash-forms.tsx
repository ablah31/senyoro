"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { closeCashAction, openCashAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CashForms({
  date,
  sessionId,
  defaultOpeningCash,
  closed,
}: {
  date: string;
  sessionId: string | null;
  defaultOpeningCash: number;
  closed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [openingCash, setOpeningCash] = useState(String(defaultOpeningCash));
  const [openingMm, setOpeningMm] = useState("0");
  const [countedCash, setCountedCash] = useState("");
  const [countedMm, setCountedMm] = useState("");
  const [comment, setComment] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await openCashAction({
              businessDate: date,
              openingCash: Number(openingCash || 0),
              openingMobileMoney: Number(openingMm || 0),
            });
            if (result.error) toast.error(result.error);
            else toast.success("Fond de caisse enregistré");
          });
        }}
      >
        <p className="font-semibold">Ouverture</p>
        <div className="space-y-2">
          <Label>Fond espèces (facultatif)</Label>
          <Input className="h-11" inputMode="numeric" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Solde Mobile Money initial</Label>
          <Input className="h-11" inputMode="numeric" value={openingMm} onChange={(e) => setOpeningMm(e.target.value)} />
        </div>
        <Button className="h-11 w-full" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'ouverture"}
        </Button>
      </form>

      <form
        className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sessionId) {
            toast.error("Ouvrez d'abord la caisse");
            return;
          }
          startTransition(async () => {
            const result = await closeCashAction({
              sessionId,
              countedCash: Number(countedCash || 0),
              countedMobileMoney: Number(countedMm || 0),
              comment,
            });
            if (result.error) toast.error(result.error);
            else toast.success("Caisse clôturée");
          });
        }}
      >
        <p className="font-semibold">Clôture facultative</p>
        {closed ? <p className="text-sm text-muted-foreground">Cette journée est déjà clôturée.</p> : null}
        <div className="space-y-2">
          <Label>Espèces réellement présentes</Label>
          <Input className="h-11" inputMode="numeric" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Solde Mobile Money réel</Label>
          <Input className="h-11" inputMode="numeric" value={countedMm} onChange={(e) => setCountedMm(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Commentaire</Label>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <Button className="h-11 w-full" disabled={pending || closed}>
          {pending ? "Enregistrement…" : "Clôturer"}
        </Button>
      </form>
    </div>
  );
}
