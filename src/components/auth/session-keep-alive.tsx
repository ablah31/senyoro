"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

let didStart = false;

function startPersistentSession() {
  if (didStart || typeof window === "undefined") return;
  didStart = true;

  const supabase = createClient();
  void supabase.auth.startAutoRefresh();

  const refreshIfNeeded = () => {
    if (document.visibilityState !== "visible") return;
    void supabase.auth.getSession();
  };

  document.addEventListener("visibilitychange", refreshIfNeeded);
  window.addEventListener("online", refreshIfNeeded);
}

export function SessionKeepAlive() {
  useEffect(() => {
    startPersistentSession();
  }, []);

  return null;
}
