import { createHash, timingSafeEqual } from "node:crypto";

type BatchAccessCodes = Record<string, string>;

function configuredBatchAccessCodes(): BatchAccessCodes {
  try {
    const parsed: unknown = JSON.parse(process.env.BATCH_ACCESS_CODES_JSON ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0));
  } catch {
    return {};
  }
}

export function verifyBatchAccessCode(batchNumber: number, submittedCode: string): boolean {
  const expectedCode = configuredBatchAccessCodes()[String(batchNumber)];
  if (!expectedCode) return false;
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(expectedCode), digest(submittedCode));
}
