"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LoginModeProvider } from "@/contexts/LoginModeContext";
import type { LoginMode } from "@/lib/login-mode";

export default function Providers({
  children,
  loginMode,
  googleLoginConfigured,
}: {
  children: React.ReactNode;
  loginMode: LoginMode;
  googleLoginConfigured: boolean;
}) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <LoginModeProvider
          loginMode={loginMode}
          googleLoginConfigured={googleLoginConfigured}
        >
          {children}
        </LoginModeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
