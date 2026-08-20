import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALUMNI_IMAGE_FALLBACK_URL, NITER_OFFICIAL_LOGO_URL, toPublicImageUrl } from "./lib/publicImages";

describe("public image URL handling", () => {
  it("uses managed root-relative storage paths and preserves valid external URLs", () => {
    expect(toPublicImageUrl("manus-storage/alumni/test.jpg")).toBe("/manus-storage/alumni/test.jpg");
    expect(toPublicImageUrl("/manus-storage/alumni/test.jpg")).toBe("/manus-storage/alumni/test.jpg");
    expect(toPublicImageUrl("https://cdn.example.org/test.jpg")).toBe("https://cdn.example.org/test.jpg");
  });

  it("uses a managed fallback for empty and legacy Unsplash sources", () => {
    expect(toPublicImageUrl()).toBe(ALUMNI_IMAGE_FALLBACK_URL);
    expect(toPublicImageUrl("https://images.unsplash.com/photo-legacy")).toBe(ALUMNI_IMAGE_FALLBACK_URL);
  });

  it("keeps shared NITER branding on the stable same-origin route and legacy portraits on managed project storage", () => {
    const shell = readFileSync(new URL("./components/SiteShell.tsx", import.meta.url), "utf8");
    const alumniData = readFileSync(new URL("./data/alumni.ts", import.meta.url), "utf8");
    expect(shell).toContain("NITER_OFFICIAL_LOGO_URL");
    expect(NITER_OFFICIAL_LOGO_URL).toContain("niter-official-logo");
    expect(NITER_OFFICIAL_LOGO_URL).not.toContain("manus-storage");
    expect(NITER_OFFICIAL_LOGO_URL).not.toContain("api/brand");
    expect(alumniData).not.toContain("images.unsplash.com");
    expect(alumniData).toContain("/manus-storage/tanvir-ahmed_2b6cf4dc.jpg");
  });
});
