import { describe, expect, it } from "vitest";
import { hashAlumniPassword } from "./alumniClaim";
import { authenticateAlumniCredentials } from "./alumniCredentials";

function fakeDb(rows: Array<{ id: number; email: string; passwordHash: string | null; claimed: boolean }>) {
  return { select: () => ({ from: () => ({ where: () => ({ limit: async () => rows.filter(row => row.email === "a@example.com") }) }) }) };
}

describe("alumni credential authentication", () => {
  it("authenticates only the matching claimed record", async () => {
    const firstHash = hashAlumniPassword("custom-password");
    const db = fakeDb([
      { id: 1, email: "a@example.com", passwordHash: firstHash, claimed: true },
      { id: 2, email: "b@example.com", passwordHash: hashAlumniPassword("other-password"), claimed: true },
    ]);
    await expect(authenticateAlumniCredentials(db, " A@EXAMPLE.COM ", "custom-password")).resolves.toMatchObject({ id: 1 });
    await expect(authenticateAlumniCredentials(db, " A@EXAMPLE.COM ", "wrong-password")).resolves.toBeNull();
  });

  it("rejects an unclaimed record even when a legacy hash is present", async () => {
    const db = fakeDb([{ id: 1, email: "a@example.com", passwordHash: hashAlumniPassword("legacy-password"), claimed: false }]);
    await expect(authenticateAlumniCredentials(db, "a@example.com", "legacy-password")).resolves.toBeNull();
  });
});
