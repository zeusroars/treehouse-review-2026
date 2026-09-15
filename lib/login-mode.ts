export const LOGIN_MODE_COOKIE = "th_login_mode";
export const FORCE_GLOBAL_COOKIE = "th_force_global";
export const FORCE_GLOBAL_QUERY = "forceGlobal";
export const LOGIN_MODE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type LoginMode = "tw" | "global";

/**
 * - forceGlobal → always "global"
 * - missing / unknown country → "global" (overseas / non-Vercel safe default)
 * - TW → "tw"
 * - anything else → "global"
 */
export function resolveLoginMode(input: {
  country?: string | null;
  forceGlobal?: boolean;
}): LoginMode {
  if (input.forceGlobal) return "global";

  const raw = input.country?.trim();
  if (!raw) return "global";

  return raw.toUpperCase() === "TW" ? "tw" : "global";
}

export function parseLoginMode(value?: string | null): LoginMode {
  return value === "global" ? "global" : "tw";
}

/** Client-side read of `th_login_mode` (document.cookie). */
export function readLoginModeCookie(): LoginMode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOGIN_MODE_COOKIE}=([^;]*)`)
  );
  if (!match?.[1]) return null;
  return parseLoginMode(decodeURIComponent(match[1]));
}
