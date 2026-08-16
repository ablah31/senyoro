"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
      <p className="font-semibold">Une erreur est survenue</p>
      <p className="mt-2 text-sm text-muted-foreground">Réessayez, ou revenez au tableau de bord.</p>
      <button type="button" className="mt-4 text-sm text-primary hover:underline" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
