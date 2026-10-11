import { describe, expect, it } from "vitest";
import { hashAlumniPassword, verifyAlumniPassword } from "./alumniClaim";
import { authenticateAlumniCredentials, initializeMissingAlumniPasswords } from "./alumniCredentials";

const dbFields = {
  id: "id",
  fullName: "fullName",
  email: "email",
  passwordHash: "passwordHash",
  claimed: "claimed",
};

function fakeDb(rows: Array<{ id: number; fullName: string; email: string | null; passwordHash: string | null; claimed: boolean }>) {
  const updates: Array<Record<string, unknown>> = [];
  const db = {
    select: () => ({
      from: async () => rows.map(row => ({ ...row })),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          updates.push(values);
          return [{ affectedRows: 1 }];
        },
      }),
    }),
  };
  return { db, updates };
}

void dbFields;

describe("alumni credential initialization", () => {
  it("initializes only missing unclaimed hashes from each normalized email", async () => {
    const existingHash = hashAlumniPassword("custom-password");
    const { db, updates } = fakeDb([
      { id: 1, fullName: "Needs Password", email: "  A@Example.com ", passwordHash: null, claimed: false },
      { id: 2, fullName: "Configured", email: "b@example.com", passwordHash: existingHash, claimed: true },
      { id: 3, fullName: "No Email", email: null, passwordHash: null, claimed: false },
      { id: 4, fullName: "Claimed Without Hash", email: "d@example.com", passwordHash: null, claimed: true },
    ]);

    const report = await initializeMissingAlumniPasswords(db);

    expect(report.totalRecords).toBe(4);
    expect(report.initialized).toEqual([{ id: 1, fullName: "Needs Password" }]);
    expect(report.alreadyConfigured).toBe(1);
    expect(report.skippedMissingEmail).toEqual([{ id: 3, fullName: "No Email", reason: "missing_email" }]);
    expect(report.skippedClaimed).toEqual([{ id: 4, fullName: "Claimed Without Hash", reason: "claimed_without_password" }]);
    expect(updates).toHaveLength(1);
    expect(typeof updates[0]?.passwordHash).toBe("string");
    expect(verifyAlumniPassword("a@example.com", String(updates[0]?.passwordHash))).toBe(true);
    expect(verifyAlumniPassword("b@example.com", existingHash)).toBe(false);
    expect(verifyAlumniPassword("custom-password", existingHash)).toBe(true);
  });

  it("authenticates against the matching normalized email record only", async () => {
    const firstHash = hashAlumniPassword("a@example.com");
    const secondHash = hashAlumniPassword("b@example.com");
    const rows = [
      { id: 1, email: "a@example.com", passwordHash: firstHash },
      { id: 2, email: "b@example.com", passwordHash: secondHash },
    ];
    const db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => rows.filter(row => row.email === "a@example.com") }) }) }) };

    await expect(authenticateAlumniCredentials(db, " A@EXAMPLE.COM ", "a@example.com")).resolves.toMatchObject({ id: 1 });
    await expect(authenticateAlumniCredentials(db, " A@EXAMPLE.COM ", "b@example.com")).resolves.toBeNull();
  });
});
