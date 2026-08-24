import type { CookieOptionsWithName } from "@supabase/ssr";

/** Chrome (and other browsers) cap persistent cookies at 400 days. */
export const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export const authCookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export function persistAuthCookies<T extends { maxAge?: number }>(options: T): T & CookieOptionsWithName {
  const isRemoval = options.maxAge === 0;
  return {
    ...authCookieOptions,
    ...options,
    maxAge: isRemoval ? 0 : (options.maxAge ?? AUTH_COOKIE_MAX_AGE),
  };
}
