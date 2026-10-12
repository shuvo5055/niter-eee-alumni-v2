import { describe, expect, it } from "vitest";
import { normalizeAlumniSearch, parseBatchSearch } from "./alumniSearch";

describe("alumni directory search normalization", () => {
  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeAlumniSearch("  DhAkA   ")).toBe("dhaka");
  });

  it("recognizes exact batch formats without partial batch matches", () => {
    expect(parseBatchSearch("Batch 12")).toBe(12);
    expect(parseBatchSearch("batch-12")).toBe(12);
    expect(parseBatchSearch(" 12 ")).toBe(12);
    expect(parseBatchSearch("Batch 1" )).toBe(1);
    expect(parseBatchSearch("Batch 120")).toBeNull();
    expect(parseBatchSearch("12th batch")).toBeNull();
  });

  it("does not classify names or organization text as batch searches", () => {
    expect(parseBatchSearch("Power Grid Bangladesh PLC")).toBeNull();
    expect(parseBatchSearch("Tauhid 12")).toBeNull();
  });
});
