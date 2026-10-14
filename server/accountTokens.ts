import { createHash, randomBytes } from "node:crypto";

export type AccountTokenType = "CLAIM" | "RESET_PASSWORD";

export const TOKEN_TTL_MS = {
  CLAIM: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
} as const;

export function createRawAccountToken() {
  return randomBytes(32).toString("hex");
}

export function hashAccountToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenExpiry(type: AccountTokenType, now = Date.now()) {
  return new Date(now + TOKEN_TTL_MS[type]);
}

export function isTokenUsable(row: { usedAt?: Date | null; expiresAt: Date }) {
  return !row.usedAt && row.expiresAt.getTime() > Date.now();
}
