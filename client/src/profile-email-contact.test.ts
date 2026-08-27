import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("alumni profile email contact", () => {
  it("adds a valid, profile-specific mailto action without rendering an email button for an empty address", () => {
    const profile = readFileSync(new URL("./pages/Profile.tsx", import.meta.url), "utf8");
    const admin = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");
    const claim = readFileSync(new URL("./components/AlumniClaimPanel.tsx", import.meta.url), "utf8");

    expect(profile).toContain("Mail");
    expect(profile).toContain("const contactEmail");
    expect(profile).toContain("mailto:${contactEmail}");
    expect(profile).toContain("...(contactEmail ? [{ label: \"Email\"");
    expect(profile).toContain('href.startsWith("mailto:")');
    expect(admin).toContain('email: ""');
    expect(admin).toContain('label="Email address" type="email"');
    expect(claim).toContain('label="Registered email (changes require approval)" type="email"');
  });
});
