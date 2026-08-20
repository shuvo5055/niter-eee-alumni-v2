import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./pages/Jobs.tsx", import.meta.url), "utf8");

describe("Jobs visual edits", () => {
  it("removes only the requested professional-path heading without leaving empty markup", () => {
    expect(source).not.toContain("Find a field.");
    expect(source).not.toContain("Meet its people.");
    expect(source).not.toContain("<h2><br/><em></em></h2>");
    expect(source).toContain("PROFESSIONAL PATHS");
    expect(source).toContain("job-category-list");
  });
});
