"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StandaloneNavigation } from "@/components/layout/standalone-navigation";
import { SessionKeepAlive } from "@/components/auth/session-keep-alive";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SessionKeepAlive />
      <StandaloneNavigation />
      {children}
      <Toaster richColors position="top-center" />
    </TooltipProvider>
  );
}
