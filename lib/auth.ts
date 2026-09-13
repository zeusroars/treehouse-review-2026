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
        if (profile && typeof profile === "object") {
          const lineProfile = profile as {
            name?: string;
            picture?: string;
          };
          if (lineProfile.name) token.name = lineProfile.name;
          if (lineProfile.picture) token.picture = lineProfile.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.voterId === "string" && token.voterId) {
        session.voterId = token.voterId;
      }
      if (session.user) {
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
};
