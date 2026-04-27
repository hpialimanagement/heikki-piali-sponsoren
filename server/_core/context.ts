import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For password-based authentication, we don't use OAuth
  // The user object is null by default, and authentication is handled
  // through the cookie-based password system in routers.ts
  const user: User | null = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
