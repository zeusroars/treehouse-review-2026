import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";

function profileSub(
  profile: unknown,
  providerAccountId?: string | null
): string | undefined {
  if (profile && typeof profile === "object" && "sub" in profile) {
    const sub = (profile as { sub?: unknown }).sub;
    if (typeof sub === "string" && sub.trim()) return sub.trim();
  }
  return providerAccountId?.trim() || undefined;
}

/** Google-only namespaced voterId so it never collides with bare LINE UIDs in GAS. */
export function toGoogleVoterId(rawId?: string | null): string | undefined {
  const id = rawId?.trim();
  if (!id) return undefined;
  if (id.startsWith("google:")) return id;
  return `google:${id}`;
}

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
);

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
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "line") {
        // Keep bare LINE `sub` for compatibility with existing GAS vote rows.
        const voterId = profileSub(profile, account.providerAccountId);
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

      if (account?.provider === "google") {
        const voterId = toGoogleVoterId(
          profileSub(profile, account.providerAccountId)
        );
        if (voterId) token.voterId = voterId;
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

export function isGoogleLoginConfigured(): boolean {
  return googleConfigured;
}
