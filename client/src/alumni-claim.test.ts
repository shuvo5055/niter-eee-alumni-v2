import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const profile = readFileSync(new URL("./pages/Profile.tsx", import.meta.url), "utf8");
const claimPanel = readFileSync(new URL("./components/AlumniClaimPanel.tsx", import.meta.url), "utf8");
const admin = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");

describe("alumni claim experience", () => {
  it("adds the claim entry point to existing public profiles without replacing their rendering", () => {
    expect(profile).toContain("<AlumniClaimPanel");
    expect(profile).toContain("profile-grid");
  });

  it("provides email-only first-time claim, sign-in, and an approval-safe email-change request", () => {
    expect(claimPanel).toContain("First-time claim");
    expect(claimPanel).toContain("Sign in to profile");
    expect(claimPanel).toContain("Submit update for review");
    expect(claimPanel).toContain("Registered email (changes require approval)");
    expect(claimPanel).toContain("Your registered email stays private. Any change requires administrator approval.");
    expect(claimPanel).toContain("pendingDraft.photoUrl");
    expect(claimPanel).not.toContain("Alumni ID");
  });

  it("adds an Administrator review destination without removing existing management routes", () => {
    expect(admin).toContain('label: "Profile Reviews"');
    expect(admin).toContain('path: "/admin/reviews"');
    expect(admin).toContain('label: "Alumni Management"');
  });
});
