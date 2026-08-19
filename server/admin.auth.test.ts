import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("protected administration access", () => {
  it("rejects anonymous dashboard requests", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous user-management requests", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
