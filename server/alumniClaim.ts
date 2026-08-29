import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const nullableText = z.string().trim().max(5000).optional().nullable();
const nullableShortText = z.string().trim().max(500).optional().nullable();
const optionalEmail = z.string().trim().max(320).refine(value => !value || z.string().email().safeParse(value).success, "Enter a valid email address.").transform(value => value ? value.toLowerCase() : undefined).optional();

export const normalizeAlumniEmail = (email: string) => email.trim().toLowerCase();

export const alumniClaimIdentityInput = z.object({
  email: z.string().trim().email().max(320).transform(normalizeAlumniEmail),
});

export const alumniClaimSignInInput = alumniClaimIdentityInput.extend({ password: z.string().min(1).max(256) });

export const alumniProfileDraftInput = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: optionalEmail,
  batchId: z.number().int().positive().nullable().optional(),
  districtId: z.number().int().positive().nullable().optional(),
  session: nullableShortText,
  phone: nullableShortText,
  address: nullableText,
  graduationYear: z.number().int().min(1950).max(2100).nullable().optional(),
  bloodGroup: nullableShortText,
  photoUrl: nullableText,
  school: nullableText,
  college: nullableText,
  bsc: nullableText,
  msc: nullableText,
  skill: nullableText,
  researchActivities: nullableText,
  currentOrganization: nullableText,
  currentDesignation: nullableText,
  currentDuration: nullableShortText,
  previousOrganization: nullableText,
  previousDesignation: nullableText,
  previousDuration: nullableShortText,
  whatsapp: nullableText,
  facebook: nullableText,
  linkedin: nullableText,
  country: nullableShortText,
  city: nullableShortText,
  industry: nullableShortText,
});

export type AlumniProfileDraft = z.infer<typeof alumniProfileDraftInput>;

export function hashAlumniPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyAlumniPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [algorithm, saltHex, keyHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
