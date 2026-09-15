import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FORCE_GLOBAL_COOKIE,
  FORCE_GLOBAL_QUERY,
  LOGIN_MODE_COOKIE,
  LOGIN_MODE_MAX_AGE_SECONDS,
  resolveLoginMode,
  type LoginMode,
} from "@/lib/login-mode";

function applyLoginModeCookie(
  response: NextResponse,
  mode: LoginMode,
  options: { forceGlobal: boolean; persistForceFlag: boolean }
): NextResponse {
  response.cookies.set(LOGIN_MODE_COOKIE, mode, {
    path: "/",
    sameSite: "lax",
    // Spec: ?forceGlobal=true persists "global" for 30 days.
    ...(options.forceGlobal
      ? { maxAge: LOGIN_MODE_MAX_AGE_SECONDS }
      : {}),
  });

  if (options.persistForceFlag) {
    response.cookies.set(FORCE_GLOBAL_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: LOGIN_MODE_MAX_AGE_SECONDS,
    });
  }

  response.headers.set("x-login-mode", mode);
  return response;
}

export function middleware(request: NextRequest) {
  const forceFromQuery =
    request.nextUrl.searchParams.get(FORCE_GLOBAL_QUERY) === "true";
  const forceFromCookie =
    request.cookies.get(FORCE_GLOBAL_COOKIE)?.value === "1";
  const forceGlobal = forceFromQuery || forceFromCookie;

  const country =
    request.headers.get("x-vercel-ip-country") ??
    process.env.DEV_FAKE_COUNTRY ??
    null;

  const mode = resolveLoginMode({ country, forceGlobal });

  return applyLoginModeCookie(NextResponse.next(), mode, {
    forceGlobal,
    persistForceFlag: forceFromQuery,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
