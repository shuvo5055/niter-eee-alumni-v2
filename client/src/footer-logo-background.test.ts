import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("footer-only NITER logo treatment", () => {
  it("removes the embedded black field in the footer without changing the header logo", () => {
    const shell = readFileSync(new URL("./components/SiteShell.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./niter-logo-blend.css", import.meta.url), "utf8");

    expect(shell).toContain('className="official-niter-logo thesis-institute-lockup__logo"');
    expect(shell).toContain('id="footer-logo-remove-black"');
    expect(shell).toContain('filter="url(#footer-logo-remove-black)"');
    expect(styles).toContain(".official-footer__logo");
    expect(styles).toContain("mix-blend-mode:normal");
  });
});
