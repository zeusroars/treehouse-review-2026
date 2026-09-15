import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Stable voter identity for GAS: bare LINE `sub`, or `google:{sub}`. */
    voterId?: string;
    user?: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    voterId?: string;
  }
}
