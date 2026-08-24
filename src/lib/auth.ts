import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseAppRole, type AppRole } from "@/lib/roles";
import type { User } from "@supabase/supabase-js";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type { AppRole };

export type ActionContext = {
  supabase: AppSupabaseClient;
  user: User;
  orgId: string;
  role: AppRole;
};

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

/**
 * Single auth + profile lookup for mutations.
 * Prefer this in server actions over chaining requireUser / requireClient / getOrgId.
 */
export const requireActionContext = cache(async (): Promise<ActionContext> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (error || !profile) throw new Error("Organisation introuvable");
  return { supabase, user, orgId: profile.organization_id, role: parseAppRole(profile.role) };
});

export const requireAdmin = cache(async (): Promise<ActionContext> => {
  const ctx = await requireActionContext();
  if (ctx.role !== "admin") throw new Error("Accès refusé");
  return ctx;
});

export async function getOrgId() {
  const { orgId } = await requireActionContext();
  return orgId;
}

export function actionError(error: unknown, fallback = "Enregistrement impossible") {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
