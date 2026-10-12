export function normalizeAlumniSearch(value: string | undefined | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Numeric search terms are treated as batch searches, never as arbitrary
 * substring searches across IDs, phone numbers, or unrelated fields.
 */
export function parseBatchSearch(value: string | undefined | null) {
  const normalized = normalizeAlumniSearch(value);
  const match = normalized.match(/^batch[\s_-]*(\d+)$/) ?? normalized.match(/^(\d+)$/);
  if (!match) return null;
  const batchNumber = Number(match[1]);
  return Number.isInteger(batchNumber) && batchNumber > 0 && batchNumber < 100 ? batchNumber : null;
}
