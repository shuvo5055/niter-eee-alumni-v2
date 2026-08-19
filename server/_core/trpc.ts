import { UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

const directAdministrator: NonNullable<TrpcContext["user"]> = {
  id: 0,
  openId: "direct-admin-access",
  name: "Administrator",
  email: null,
  loginMethod: "direct-access",
  role: "admin",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(0),
};

const directAdminAccess = t.middleware(async opts => {
  const { ctx, next } = opts;
  return next({ ctx: { ...ctx, user: ctx.user ?? directAdministrator } });
});

// The administration interface is intentionally direct-access: no OAuth, login prompt,
// or role gate is required. Mutations are recorded against the direct administrator actor.
export const adminProcedure = t.procedure.use(directAdminAccess);
export const editorProcedure = t.procedure.use(directAdminAccess);
