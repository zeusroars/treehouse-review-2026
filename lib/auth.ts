import type { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";

function lineUserId(profile: unknown, providerAccountId?: string | null): string | undefined {
  if (profile && typeof profile === "object" && "sub" in profile) {
    const sub = (profile as { sub?: unknown }).sub;
    if (typeof sub === "string" && sub.trim()) return sub.trim();
  }
  const fallback = providerAccountId?.trim();
  return fallback || undefined;
}

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID ?? "",
      clientSecret: process.env.LINE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // Keep OpenID so LINE returns `sub`; aggressive bot prompt forces the official-account friend sheet.
          scope: "openid profile",
          bot_prompt: "aggressive",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "line") {
        const voterId = lineUserId(profile, account.providerAccountId);
        if (voterId) token.voterId = voterId;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.voterId === "string" && token.voterId) {
        session.voterId = token.voterId;
      }
      return session;
    },
  },
};
