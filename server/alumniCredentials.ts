import { eq } from "drizzle-orm";
import { alumni } from "../drizzle/schema";
import { normalizeAlumniEmail, verifyAlumniPassword } from "./alumniClaim";

/** Authenticate only accounts that have completed a secure claim or reset flow. */
export async function authenticateAlumniCredentials(db: any, email: string, password: string) {
  const normalizedEmail = normalizeAlumniEmail(email);
  const [record] = await db.select().from(alumni).where(eq(alumni.email, normalizedEmail)).limit(1);
  if (!record?.claimed || !record.passwordHash || !verifyAlumniPassword(password, record.passwordHash)) return null;
  return record;
}
