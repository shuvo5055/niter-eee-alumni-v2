import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("reversed Home Hero composition", () => {
  it("scopes the mirror to the Home Hero and preserves a logical mobile reading order", () => {
    const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
    const artwork = readFileSync(new URL("./hero-code-artwork.css", import.meta.url), "utf8");

    expect(home).toContain('className="hero hero--reverse"');
    expect(artwork).toContain(".hero--reverse .hero__inner");
    expect(artwork).toContain("flex-direction: row-reverse");
    expect(artwork).toContain(".hero--reverse .hero__network");
    expect(artwork).toContain("transform: scaleX(-1)");
    expect(artwork).toContain("flex-direction: column");
    expect(artwork).toContain(".hero--reverse .hero__copy");
    expect(artwork).toContain("order: 2");
  });
});
