import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "user" | "editor" | "admin"): TrpcContext {
  return {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("administration authorization", () => {
  it("rejects a standard user before any secured administration query runs", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an editor from Super Admin-only role management", async () => {
    const caller = appRouter.createCaller(contextWithRole("editor"));
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
