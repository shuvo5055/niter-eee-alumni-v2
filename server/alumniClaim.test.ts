import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { alumniClaimIdentityInput, alumniClaimSetupInput, hashAlumniPassword, normalizeAlumniEmail, verifyAlumniPassword } from "./alumniClaim";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return { user: null, alumniSession: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("alumni self-claim security", () => {
  it("normalizes email and stores password material as a salted one-way verifier", () => {
    const hash = hashAlumniPassword("A secure alumni password");
    expect(normalizeAlumniEmail("  ALUMNI@NITER.EDU.BD ")).toBe("alumni@niter.edu.bd");
    expect(hash).not.toContain("A secure alumni password");
    expect(verifyAlumniPassword("A secure alumni password", hash)).toBe(true);
    expect(verifyAlumniPassword("wrong password", hash)).toBe(false);
  });

  it("requires a valid existing-record email, Alumni ID, and secure first-time password", () => {
    expect(alumniClaimIdentityInput.safeParse({ email: "bad", studentId: "EE-1" }).success).toBe(false);
    expect(alumniClaimSetupInput.safeParse({ email: "alumni@niter.edu.bd", studentId: "EE-1", password: "short" }).success).toBe(false);
    expect(alumniClaimSetupInput.safeParse({ email: "alumni@niter.edu.bd", studentId: "EE-1", password: "claim-password-2026" }).success).toBe(true);
  });

  it("rejects anonymous claimant profile edits and anonymous Admin review access", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.alumniClaim.profile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.profileChanges.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps Excel imports from writing claim credentials", () => {
    const importer = readFileSync(new URL("./alumniImport.ts", import.meta.url), "utf8");
    expect(importer).not.toContain("passwordHash");
    expect(importer).not.toContain("claimFailedAttempts");
  });

  it("keeps registered contact fields in Admin payloads only and clears a finished lock window", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const publicSelection = routers.slice(routers.indexOf("const publicAlumniSelect"), routers.indexOf("const adminAlumniSelect"));
    expect(publicSelection).not.toContain("email: alumni.email");
    expect(publicSelection).not.toContain("phone: alumni.phone");
    expect(publicSelection).not.toContain("address: alumni.address");
    expect(routers).toContain("const adminAlumniSelect = { ...publicAlumniSelect, email: alumni.email, phone: alumni.phone, address: alumni.address");
    expect(routers).toContain("record.claimLockedUntil && record.claimLockedUntil <= now ? 0 : record.claimFailedAttempts ?? 0");
  });
});
