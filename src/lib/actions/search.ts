"use server";

import { requireActionContext } from "@/lib/auth";
import { searchGlobal } from "@/lib/queries";

export async function searchGlobalAction(query: string) {
  const { role } = await requireActionContext();
  const results = await searchGlobal(query);
  if (role !== "responsable") return results;
  return results.filter((row) => row.entity === "wash" || row.entity === "vehicle");
}
