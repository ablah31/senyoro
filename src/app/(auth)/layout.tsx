import { Droplets } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Droplets className="size-5" />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight">Senyoro</p>
          <p className="text-xs text-muted-foreground">Centre de lavage</p>
        </div>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
