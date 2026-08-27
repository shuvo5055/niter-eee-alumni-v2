import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("database-only public listings", () => {
  it("does not import legacy alumni fixtures in public alumni views", () => {
    for (const file of ["./pages/Home.tsx", "./pages/Alumni.tsx", "./pages/BatchDetail.tsx", "./pages/DistrictDetail.tsx", "./pages/Jobs.tsx", "./pages/Profile.tsx"]) {
      expect(source(file)).not.toContain("@/data/alumni");
      expect(source(file)).not.toContain("legacyAlumni");
    }
  });

  it("shows managed loading states rather than cards while public queries are fetching", () => {
    expect(source("./pages/Home.tsx")).toContain("managedAlumni.isFetching");
    for (const file of ["./pages/Alumni.tsx", "./pages/BatchDetail.tsx", "./pages/DistrictDetail.tsx", "./pages/Jobs.tsx"]) {
      expect(source(file)).toContain("managed.isFetching");
      expect(source(file)).toContain("AlumniCardsLoading");
    }
    expect(source("./pages/Batches.tsx")).toContain("DirectoryLoading");
    expect(source("./pages/Districts.tsx")).toContain("DirectoryLoading");
    expect(source("./pages/Gallery.tsx")).toContain("GalleryLoading");
  });

  it("uses explicit empty states after managed results resolve", () => {
    for (const file of ["./pages/Alumni.tsx", "./pages/BatchDetail.tsx", "./pages/DistrictDetail.tsx", "./pages/Jobs.tsx"]) {
      expect(source(file)).toContain("No alumni found");
    }
    expect(source("./pages/Gallery.tsx")).toContain("No gallery records found");
    expect(source("./pages/Profile.tsx")).toContain("RECORD NOT FOUND");
  });
});
