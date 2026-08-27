import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("first-release Home Hero composition", () => {
  it("uses the first public artwork and excludes later replacement overlays", () => {
    const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
    const artwork = readFileSync(new URL("./hero-code-artwork.css", import.meta.url), "utf8");

    expect(home).toContain('className="hero"');
    expect(home).not.toContain("hero--reverse");
    expect(home).not.toContain("hero__network");
    expect(artwork).not.toContain("hero--reverse");
    expect(artwork).toContain('url("/manus-storage/niter-eee-alumni-hero_08acf207.png")');
    expect(artwork).toContain("mask-image: linear-gradient(90deg, #000, transparent 71%)");
    expect(artwork).toContain("background-position: 68% center");

    const entry = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(entry.indexOf('import "./index.css";')).toBeLessThan(entry.indexOf('import "./hero-code-artwork.css";'));
  });
});
