import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** LINE Login `sub` — stable voter identity sent to GAS. */
    voterId?: string;
    user?: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    voterId?: string;
  }
}
