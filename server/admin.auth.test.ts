import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function directAccessContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("direct administration access", () => {
  it("returns dashboard data without an authenticated user", async () => {
    const caller = appRouter.createCaller(directAccessContext());
    const overview = await caller.admin.overview();
    expect(overview.counts).toHaveProperty("alumni");
    expect(Array.isArray(overview.recentAlumni)).toBe(true);
  });

  it("returns the existing user list without a role gate", async () => {
    const caller = appRouter.createCaller(directAccessContext());
    await expect(caller.admin.users.list()).resolves.toBeInstanceOf(Array);
  });
});
