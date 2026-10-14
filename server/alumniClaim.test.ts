import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { alumniClaimIdentityInput, alumniClaimSignInInput, alumniProfileDraftInput, hashAlumniPassword, normalizeAlumniEmail, verifyAlumniPassword } from "./alumniClaim";
import { hashAccountToken, isTokenUsable, tokenExpiry } from "./accountTokens";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return { user: null, alumniSession: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("alumni account claim security", () => {
  it("normalizes email and stores password material as a salted one-way verifier", () => {
    const hash = hashAlumniPassword("A secure alumni password");
    expect(normalizeAlumniEmail("  ALUMNI@NITER.EDU.BD ")).toBe("alumni@niter.edu.bd");
    expect(hash).not.toContain("A secure alumni password");
    expect(verifyAlumniPassword("A secure alumni password", hash)).toBe(true);
    expect(verifyAlumniPassword("wrong password", hash)).toBe(false);
  });

  it("accepts valid identity, sign-in, and profile draft payloads", () => {
    expect(alumniClaimIdentityInput.safeParse({ email: "bad" }).success).toBe(false);
    expect(alumniClaimIdentityInput.safeParse({ email: " alumni@niter.edu.bd " }).success).toBe(true);
    expect(alumniClaimSignInInput.safeParse({ email: "alumni@niter.edu.bd", password: "existing-password" }).success).toBe(true);
    expect(alumniProfileDraftInput.parse({ fullName: "Verified Alumni", email: " NEW.EMAIL@NITER.EDU.BD " }).email).toBe("new.email@niter.edu.bd");
  });

  it("hashes raw tokens and enforces one-time expiry semantics", () => {
    const raw = "a".repeat(64);
    expect(hashAccountToken(raw)).not.toBe(raw);
    const future = tokenExpiry("CLAIM");
    expect(isTokenUsable({ expiresAt: future, usedAt: null })).toBe(true);
    expect(isTokenUsable({ expiresAt: future, usedAt: new Date() })).toBe(false);
    expect(isTokenUsable({ expiresAt: new Date(Date.now() - 1), usedAt: null })).toBe(false);
  });

  it("rejects anonymous claimant profile edits and anonymous Admin review access", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.alumniClaim.profile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.profileChanges.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("forbids all email-derived password initialization paths", () => {
    const importer = readFileSync(new URL("./alumniImport.ts", import.meta.url), "utf8");
    const credentials = readFileSync(new URL("./alumniCredentials.ts", import.meta.url), "utf8");
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(importer).not.toContain("hashAlumniPassword");
    expect(importer).toContain("passwordHash: null");
    expect(credentials).not.toContain("initializeMissingAlumniPasswords");
    expect(routers).not.toContain("initializeMissingPasswords");
    expect(routers).not.toContain("hashAlumniPassword(values.email)");
    expect(routers).not.toContain("hashAlumniPassword(submission.email)");
    expect(routers).toContain("requestClaim: publicProcedure");
    expect(routers).toContain("completeClaim: publicProcedure");
    expect(routers).toContain("completePasswordReset: publicProcedure");
  });

  it("keeps registered contact fields private while preserving owner-only updates", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const publicSelection = routers.slice(routers.indexOf("const publicAlumniSelect"), routers.indexOf("const adminAlumniSelect"));
    expect(publicSelection).not.toContain("email: alumni.email");
    expect(publicSelection).not.toContain("phone: alumni.phone");
    expect(publicSelection).not.toContain("address: alumni.address");
    expect(routers).toContain("const adminAlumniSelect = { ...publicAlumniSelect, email: alumni.email, phone: alumni.phone, address: alumni.address");
    expect(routers).toContain("const publicProfileAlumniSelect = { ...publicAlumniSelect }");
    expect(routers).toContain("db.select(publicProfileAlumniSelect)");
    expect(routers).toContain("submitProfileChange: alumniProcedure");
  });

  it("stores uploaded personal photos in the claimant's pending review record", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routers).toContain("profile_photo_uploaded");
    expect(routers).toContain("photoUrl: result.url");
    expect(routers).toContain("pendingReview: true");
  });
});
