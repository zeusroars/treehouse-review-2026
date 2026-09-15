"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  parseLoginMode,
  readLoginModeCookie,
  type LoginMode,
} from "@/lib/login-mode";

interface LoginModeContextValue {
  loginMode: LoginMode;
  /** Show Google when cookie mode is global and Google OAuth env is configured. */
  allowGoogleLogin: boolean;
  googleLoginConfigured: boolean;
}

const LoginModeContext = createContext<LoginModeContextValue>({
  loginMode: "tw",
  allowGoogleLogin: false,
  googleLoginConfigured: false,
});

export function LoginModeProvider({
  loginMode: initialLoginMode,
  googleLoginConfigured,
  children,
}: {
  loginMode: LoginMode;
  googleLoginConfigured: boolean;
  children: ReactNode;
}) {
  const [loginMode, setLoginMode] = useState<LoginMode>(initialLoginMode);

  // Prefer live cookie (covers ?forceGlobal=true without full remount).
  useEffect(() => {
    const fromCookie = readLoginModeCookie();
    if (fromCookie) setLoginMode(fromCookie);
  }, [initialLoginMode]);

  const value = useMemo<LoginModeContextValue>(() => {
    const mode = parseLoginMode(loginMode);
    return {
      loginMode: mode,
      googleLoginConfigured,
      allowGoogleLogin: mode === "global" && googleLoginConfigured,
    };
  }, [loginMode, googleLoginConfigured]);

  return (
    <LoginModeContext.Provider value={value}>
      {children}
    </LoginModeContext.Provider>
  );
}

export function useLoginMode(): LoginModeContextValue {
  return useContext(LoginModeContext);
}
