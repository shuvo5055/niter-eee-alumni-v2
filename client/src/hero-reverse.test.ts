import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("original Home Hero composition", () => {
  it("uses the original Circuit Archive layout without reverse-only overrides", () => {
    const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
    const artwork = readFileSync(new URL("./hero-code-artwork.css", import.meta.url), "utf8");

    expect(home).toContain('className="hero"');
    expect(home).not.toContain("hero--reverse");
    expect(artwork).not.toContain("hero--reverse");
    expect(artwork).toContain("right: -4%");
    expect(artwork).toContain("mask-image: linear-gradient(90deg, #000 0 49%, transparent 86%)");
  });
});
