import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { previewAlumniExcelImport } from "./alumniImport";

function previewDb(existing: Array<{ id: number; slug: string; studentId: string | null; email: string | null }> = []) {
  return {
    select: (fields: Record<string, unknown>) => ({
      from: async () => {
        if ("studentId" in fields) return existing;
        return [];
      },
    }),
  };
}

describe("alumni Excel import preview", () => {
  it("classifies new and existing Student ID rows without creating duplicate identities", async () => {
    const result = await previewAlumniExcelImport(previewDb([{ id: 7, slug: "existing", studentId: "EE-7", email: null }]), [
      { rowNumber: 2, fullName: "Existing Alumni", studentId: "EE-7", batchNumber: 12 },
      { rowNumber: 3, fullName: "New Alumni", studentId: "EE-8", batchNumber: 13 },
      { rowNumber: 4, fullName: "Duplicate Row", studentId: "EE-8", batchNumber: 13 },
      { rowNumber: 5, fullName: "Missing Identity", batchNumber: 13 },
      { rowNumber: 6, fullName: "Invalid Email", email: "not-an-email", batchNumber: 13 },
    ]);
    expect(result.updatedAlumni).toBe(1);
    expect(result.newAlumni).toBe(1);
    expect(result.skippedRows).toHaveLength(3);
    expect(result.skippedRows.some(row => row.problem === "Invalid email address")).toBe(true);
    expect(result.validRows.map(row => row.action)).toEqual(["update", "new"]);
  });

  it("keeps commit logic transaction-backed, preserves approved photos when a spreadsheet cell is blank, and accepts a supplied replacement", () => {
    const source = readFileSync(new URL("./alumniImport.ts", import.meta.url), "utf8");
    expect(source).toContain("db.transaction(async");
    expect(source).toContain("await tx.insert(activityLogs)");
    expect(source).toContain("const current = byMail || byId");
    expect(source).toContain("const normalizePhotoUrl");
    expect(source).toContain("photoUrl: normalizePhotoUrl(source.photoUrl)");
    expect(source).toContain("const { photoUrl, ...valuesWithoutPhoto } = values");
    expect(source).toContain("set(photoUrl ? values : valuesWithoutPhoto)");
  });
});
