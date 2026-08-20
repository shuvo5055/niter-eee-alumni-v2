import { describe, expect, it } from "vitest";
import { normalizeExcelHeader, suggestAlumniImportMapping, toImportText } from "./alumniImport";

describe("Excel alumni import mapping", () => {
  it("maps common spreadsheet header aliases to the normalized import contract", () => {
    expect(suggestAlumniImportMapping(["Alumni ID", "Name", "Batch No", "Job Title", "Profile Image URL"])).toMatchObject({
      studentId: "Alumni ID", fullName: "Name", batchNumber: "Batch No", currentDesignation: "Job Title", photoUrl: "Profile Image URL",
    });
  });

  it("normalizes headings and blanks predictably", () => {
    expect(normalizeExcelHeader(" Current_Organization ")).toBe("current organization");
    expect(toImportText("   ")).toBeNull();
  });
});
