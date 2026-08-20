import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./pages/Districts.tsx", import.meta.url), "utf8");

describe("District Directory visual edits", () => {
  it("removes only the requested Start with a place heading", () => {
    expect(source).not.toContain("Start with a");
    expect(source).toContain("64 DISTRICTS");
    expect(source).toContain('placeholder="Search District"');
  });
});
