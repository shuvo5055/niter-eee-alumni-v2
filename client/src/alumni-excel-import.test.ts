import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(new URL("./components/AlumniExcelImport.tsx", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");

describe("Alumni Excel import interface", () => {
  it("exposes template, Excel upload, mapping, preview, and commit controls", () => {
    expect(component).toContain("Excel template");
    expect(component).toContain("accept=\".xlsx,.xls");
    expect(component).toContain("COLUMN MAPPING");
    expect(component).toContain("Validate & preview");
    expect(component).toContain("Import completed successfully");
    expect(component).toContain("commitExcelImport");
  });

  it("connects the existing Import Alumni navigation item to the Excel workflow", () => {
    expect(adminPage).toContain('path: "/admin/alumni?import=excel"');
    expect(adminPage).toContain("<AlumniExcelImport");
  });
});
