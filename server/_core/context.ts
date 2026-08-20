import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookie } from "cookie";
import { ALUMNI_SESSION_COOKIE } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type AlumniSession = { alumniId: number };

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  alumniSession?: AlumniSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let alumniSession: AlumniSession | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  try {
    const token = parseCookie(opts.req.headers.cookie || "")[ALUMNI_SESSION_COOKIE];
    const session = token ? await sdk.verifySession(token) : null;
    const match = session?.openId.match(/^alumni-claim-(\d+)$/);
    if (match?.[1]) alumniSession = { alumniId: Number(match[1]) };
  } catch {
    alumniSession = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    alumniSession,
  };
}
