import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const profile = readFileSync(new URL("./pages/Profile.tsx", import.meta.url), "utf8");
const claimPanel = readFileSync(new URL("./components/AlumniClaimPanel.tsx", import.meta.url), "utf8");
const admin = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("../../server/routers.ts", import.meta.url), "utf8");

describe("alumni claim experience", () => {
  it("adds the ownership entry point to existing public profiles without replacing their rendering", () => {
    expect(profile).toContain("<AlumniClaimPanel");
    expect(profile).toContain("registeredEmail={managed.data.email || \"\"}");
    expect(profile).toContain("profile-grid");
  });

  it("shows only registered-email and existing-password sign-in before the private editor", () => {
    expect(claimPanel).toContain("Manage My Profile");
    expect(claimPanel).toContain("Registered email address");
    expect(claimPanel).toContain("readOnly");
    expect(claimPanel).toContain("Sign in to profile");
    expect(claimPanel).toContain("Invalid registered email or password.");
    expect(claimPanel).toContain("Your registered email stays private and cannot be changed here.");
    expect(claimPanel).not.toContain("First-time claim");
    expect(claimPanel).not.toContain("Already claimed? Sign in");
    expect(claimPanel).not.toContain("Create password");
    expect(claimPanel).not.toContain("setupPassword");
    expect(claimPanel).not.toContain("Alumni ID");
  });

  it("keeps the backend on existing-password sign-in and preserves owner-only pending updates", () => {
    expect(router).toContain("signIn: publicProcedure.input(alumniClaimSignInInput)");
    expect(router).toContain("verifyAlumniPassword(input.password, record.passwordHash)");
    expect(router).toContain("submitProfileChange: alumniProcedure");
    expect(router).not.toContain("setupPassword:");
    expect(router).not.toContain("first_time_claim");
  });

  it("keeps the Administrator review destination without removing existing management routes", () => {
    expect(admin).toContain('label: "Profile Reviews"');
    expect(admin).toContain('path: "/admin/reviews"');
    expect(admin).toContain('label: "Alumni Management"');
  });
});
