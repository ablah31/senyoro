"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { getMobilePrimary, getNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CircleHelp, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/layout/global-search";

function isActive(pathname: string, href: string, match?: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  if (href === "/washes") return pathname === "/washes" || pathname.startsWith("/washes/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  orgName,
  cashEnabled,
}: {
  children: React.ReactNode;
  orgName: string;
  cashEnabled: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = getNavItems(cashEnabled);
  const mobileItems = getMobilePrimary(cashEnabled);

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">{orgName}</p>
            <p className="text-[11px] text-sidebar-foreground/60">Pilotage lavage</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="p-3">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </form>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 min-w-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur lg:h-16 lg:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
              <div className="px-5 py-4 text-sm font-semibold">{orgName}</div>
              <nav className="space-y-0.5 px-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <GlobalSearch />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-11 shrink-0", isActive(pathname, "/help") && "text-primary")}
            nativeButton={false}
            aria-label="Aide"
            title="Aide"
            render={<Link href="/help" />}
          >
            <CircleHelp />
          </Button>
        </header>
        <main className="min-w-0 overflow-x-hidden px-4 py-4 pb-24 lg:px-8 lg:py-6 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
        <ul className="grid grid-cols-4">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
