"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelWashAction } from "@/lib/actions/washes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CancelWashButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="destructive" className="h-11" onClick={() => setOpen(true)}>
        Annuler le lavage
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif d'annulation"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          className="h-11"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelWashAction(id, reason);
              if (result.error) toast.error(result.error);
              else {
                toast.success("Lavage annulé");
                router.refresh();
                setOpen(false);
              }
            })
          }
        >
          Confirmer
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setOpen(false)}>
          Retour
        </Button>
      </div>
    </div>
  );
}
