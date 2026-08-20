import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./pages/Batches.tsx", import.meta.url), "utf8");

describe("Batch Directory visual edits", () => {
  it("removes the requested batch-number and EEE BATCH labels without duplicate JSX attributes", () => {
    expect(source).not.toContain("batch-card__number");
    expect(source).not.toContain(">EEE BATCH<");
    expect(source).toContain('style={{ color: "#ffffff" }}');
    expect(source).toContain('<h3 style={{ color: "#000000" }}>');
  });
});
