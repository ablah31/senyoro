import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireClient() {
  await requireUser();
  return createClient();
}

export async function getOrgId() {
  const supabase = await requireClient();
  const { data, error } = await supabase.from("organizations").select("id").limit(1).single();
  if (error || !data) throw new Error("Organisation introuvable");
  return data.id;
}
