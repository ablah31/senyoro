"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function QuerySearch({
  name = "q",
  placeholder,
}: {
  name?: string;
  placeholder: string;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get(name) ?? "").trim();
        const search = new URLSearchParams(params.toString());
        if (value) search.set(name, value);
        else search.delete(name);
        search.delete("page");
        const query = search.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <Input
        name={name}
        defaultValue={params.get(name) ?? ""}
        placeholder={placeholder}
        className="h-11"
        aria-label={placeholder}
      />
    </form>
  );
}
