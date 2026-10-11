import { and, eq, isNull, or } from "drizzle-orm";
import { alumni } from "../drizzle/schema";
import { hashAlumniPassword, normalizeAlumniEmail, verifyAlumniPassword } from "./alumniClaim";

export type AlumniCredentialInitializationReport = {
  totalRecords: number;
  initialized: Array<{ id: number; fullName: string }>;
  alreadyConfigured: number;
  skippedClaimed: Array<{ id: number; fullName: string; reason: "claimed_without_password" }>;
  skippedMissingEmail: Array<{ id: number; fullName: string; reason: "missing_email" | "invalid_email" }>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Assign the email-as-initial-password only when an account has never had a
 * password configured. Existing hashes and claimed records are never reset.
 */
export async function initializeMissingAlumniPasswords(db: any): Promise<AlumniCredentialInitializationReport> {
  const records = await db.select({
    id: alumni.id,
    fullName: alumni.fullName,
    email: alumni.email,
    passwordHash: alumni.passwordHash,
    claimed: alumni.claimed,
  }).from(alumni);

  const report: AlumniCredentialInitializationReport = {
    totalRecords: records.length,
    initialized: [],
    alreadyConfigured: 0,
    skippedClaimed: [],
    skippedMissingEmail: [],
  };

  for (const record of records) {
    if (typeof record.passwordHash === "string" && record.passwordHash.trim()) {
      report.alreadyConfigured += 1;
      continue;
    }

    if (record.claimed) {
      report.skippedClaimed.push({ id: record.id, fullName: record.fullName, reason: "claimed_without_password" });
      continue;
    }

    const email = typeof record.email === "string" ? normalizeAlumniEmail(record.email) : "";
    if (!email) {
      report.skippedMissingEmail.push({ id: record.id, fullName: record.fullName, reason: "missing_email" });
      continue;
    }
    if (!emailPattern.test(email)) {
      report.skippedMissingEmail.push({ id: record.id, fullName: record.fullName, reason: "invalid_email" });
      continue;
    }

    const result = await db.update(alumni).set({ email, passwordHash: hashAlumniPassword(email) }).where(and(
      eq(alumni.id, record.id),
      eq(alumni.claimed, false),
      or(isNull(alumni.passwordHash), eq(alumni.passwordHash, "")),
    ));

    if (Number(result?.[0]?.affectedRows ?? 0) === 1) {
      report.initialized.push({ id: record.id, fullName: record.fullName });
    } else {
      report.alreadyConfigured += 1;
    }
  }

  return report;
}

/** Authenticate without changing claim state; the router applies session/claim side effects after this succeeds. */
export async function authenticateAlumniCredentials(db: any, email: string, password: string) {
  const normalizedEmail = normalizeAlumniEmail(email);
  const [record] = await db.select().from(alumni).where(eq(alumni.email, normalizedEmail)).limit(1);
  if (!record || !record.passwordHash || !verifyAlumniPassword(password, record.passwordHash)) return null;
  return record;
}
