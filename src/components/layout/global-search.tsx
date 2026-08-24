"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchGlobalAction } from "@/lib/actions/search";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const ENTITY_HREF: Record<string, (id: string) => string> = {
  vehicle: () => "/washes",
  customer: (id) => `/customers/${id}`,
  employee: (id) => `/employees/${id}`,
  wash: (id) => `/washes/${id}`,
};

const ENTITY_LABEL: Record<string, string> = {
  vehicle: "Véhicules",
  customer: "Clients",
  employee: "Employés",
  wash: "Lavages",
};

export function GlobalSearch({ washesOnly = false }: { washesOnly?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { entity: string; id: string; title: string; subtitle: string }[]
  >([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const data = await searchGlobalAction(query.trim());
        setResults(data);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query]);

  function goTo(entity: string, id: string) {
    setOpen(false);
    router.push(ENTITY_HREF[entity]?.(id) ?? "/dashboard");
  }

  const grouped = results.reduce<Record<string, typeof results>>((acc, item) => {
    acc[item.entity] = acc[item.entity] ?? [];
    acc[item.entity].push(item);
    return acc;
  }, {});

  const placeholder = washesOnly ? "Plaque, client, téléphone…" : "Plaque, client, téléphone, employé…";
  const description = washesOnly
    ? "Plaques et transactions"
    : "Plaques, clients, téléphones, employés et transactions";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-xl items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Recherche globale"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1">{placeholder}</span>
        <kbd className="hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Recherche"
        description={description}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim().length < 2 ? (
              <CommandEmpty>Tapez au moins 2 caractères.</CommandEmpty>
            ) : pending && results.length === 0 ? (
              <CommandEmpty>Recherche…</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>Aucun résultat</CommandEmpty>
            ) : (
              Object.entries(grouped).map(([entity, items]) => (
                <CommandGroup key={entity} heading={ENTITY_LABEL[entity] ?? entity}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.entity}-${item.id}`}
                      value={`${item.entity}-${item.id}-${item.title}`}
                      onSelect={() => goTo(item.entity, item.id)}
                    >
                      <span className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
