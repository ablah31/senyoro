"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StandaloneNavigation } from "@/components/layout/standalone-navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <StandaloneNavigation />
      {children}
      <Toaster richColors position="top-center" />
    </TooltipProvider>
  );
}
