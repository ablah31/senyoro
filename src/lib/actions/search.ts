"use server";

import { searchGlobal } from "@/lib/queries";

export async function searchGlobalAction(query: string) {
  return searchGlobal(query);
}
