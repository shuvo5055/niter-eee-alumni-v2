import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createContext, type TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { getUserByOpenId } from "./db";
import { COOKIE_NAME } from "../shared/const";

type CookieCall = { name: string; value: string; options: Record<string, unknown> };

function createCredentialContext(): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"],
    },
    cookies,
  };
}

describe("auth.signIn", () => {
  it("accepts only the configured server-side administrator credential and creates an httpOnly session", async () => {
    const { ctx, cookies } = createCredentialContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.signIn({
      email: process.env.ADMIN_EMAIL ?? "",
      password: process.env.ADMIN_PASSWORD ?? "",
    });

    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none", path: "/" });
  });

  it("turns the configured credential into a session that can access protected Admin data", async () => {
    const { ctx, cookies } = createCredentialContext();
    const caller = appRouter.createCaller(ctx);
    await caller.auth.signIn({ email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "", remember: false });

    const session = await sdk.verifySession(cookies[0]?.value);
    const user = session ? await getUserByOpenId(session.openId) : undefined;
    expect(session?.openId).toMatch(/^credential-admin-/);
    expect(user?.role).toBe("admin");

    const protectedCaller = appRouter.createCaller({ ...ctx, user: user ?? null });
    await expect(protectedCaller.admin.overview()).resolves.toMatchObject({ counts: expect.any(Object) });
  });

  it("clears the issued browser session and denies protected access after the cookie is removed", async () => {
    const { ctx, cookies } = createCredentialContext();
    const signInCaller = appRouter.createCaller(ctx);
    await signInCaller.auth.signIn({ email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "", remember: false });
    const session = await sdk.verifySession(cookies[0]?.value);
    const user = session ? await getUserByOpenId(session.openId) : undefined;
    expect(user?.role).toBe("admin");

    const cleared: Array<{ name: string; options: Record<string, unknown> }> = [];
    const logoutCaller = appRouter.createCaller({
      ...ctx,
      user: user ?? null,
      req: { protocol: "https", headers: { cookie: `${COOKIE_NAME}=${cookies[0]?.value}` } } as TrpcContext["req"],
      res: { clearCookie: (name: string, options: Record<string, unknown>) => cleared.push({ name, options }) } as TrpcContext["res"],
    });
    await expect(logoutCaller.auth.logout()).resolves.toEqual({ success: true });
    expect(cleared).toEqual([{ name: COOKIE_NAME, options: expect.objectContaining({ maxAge: -1, httpOnly: true, path: "/" }) }]);

    const postLogoutContext = await createContext({
      req: { protocol: "https", headers: { cookie: "" } } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    expect(postLogoutContext.user).toBeNull();
    const anonymousCaller = appRouter.createCaller(postLogoutContext);
    await expect(anonymousCaller.admin.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an invalid administrator credential without issuing a session", async () => {
    const { ctx, cookies } = createCredentialContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.signIn({ email: "invalid@example.com", password: "invalid-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });
});
