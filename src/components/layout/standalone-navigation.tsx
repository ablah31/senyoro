"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

function isInternalPath(href: string) {
  if (!href || href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("/api/")) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      return url.origin === window.location.origin && !url.pathname.startsWith("/api/");
    } catch {
      return false;
    }
  }
  return href.startsWith("/");
}

export function StandaloneNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandaloneDisplay()) return;

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      if (target.target === "_blank" || target.hasAttribute("download") || target.getAttribute("rel")?.includes("external")) {
        return;
      }
      const href = target.getAttribute("href");
      if (!href || !isInternalPath(href)) return;

      event.preventDefault();
      const url = href.startsWith("http") ? new URL(href) : new URL(href, window.location.origin);
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` === next) return;
      router.push(next);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
