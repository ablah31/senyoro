"use client";

import { useState, useTransition } from "react";
import { getReceiptUrlAction } from "@/lib/actions/expenses";

export function ReceiptLink({ path, fileName }: { path: string; fileName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      className="text-xs text-primary underline-offset-4 hover:underline disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        setError(null);
        startTransition(async () => {
          const result = await getReceiptUrlAction(path);
          if (result.error || !result.url) {
            setError(result.error ?? "Impossible d'ouvrir le justificatif");
            return;
          }
          window.open(result.url, "_blank", "noopener,noreferrer");
        });
      }}
    >
      {pending ? "Ouverture…" : fileName}
      {error ? <span className="ml-1 text-destructive">{error}</span> : null}
    </button>
  );
}
