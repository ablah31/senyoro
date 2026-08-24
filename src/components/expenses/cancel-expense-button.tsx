"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelExpenseAction } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CancelExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="destructive" className="h-12 w-full" onClick={() => setOpen(true)}>
        Annuler cette dépense
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
          className="h-11 flex-1"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelExpenseAction(id, reason);
              if (result.error) toast.error(result.error);
              else {
                toast.success("Dépense annulée");
                router.refresh();
                setOpen(false);
              }
            })
          }
        >
          Confirmer
        </Button>
        <Button variant="outline" className="h-11 flex-1" onClick={() => setOpen(false)}>
          Retour
        </Button>
      </div>
    </div>
  );
}
