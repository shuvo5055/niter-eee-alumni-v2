import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("alumni profile contact privacy", () => {
  it("does not expose registered email in public profile markup while retaining admin and private-editor email fields", () => {
    const profile = readFileSync(new URL("./pages/Profile.tsx", import.meta.url), "utf8");
    const admin = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");
    const claim = readFileSync(new URL("./components/AlumniClaimPanel.tsx", import.meta.url), "utf8");

    expect(profile).not.toContain("managed.data.email");
    expect(profile).not.toContain("contactEmail");
    expect(admin).toContain('email: ""');
    expect(admin).toContain('label="Email address" type="email"');
    expect(claim).toContain("Registered email address");
    expect(claim).toContain("Request secure claim link");
  });
});
