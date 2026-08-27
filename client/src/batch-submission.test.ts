import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("batch-gated public alumni submissions", () => {
  it("keeps the batch selector locked and provides a pending-review form only for enabled batches", () => {
    const panel = source("./components/BatchSubmissionPanel.tsx");
    expect(panel).toContain("new Set([11, 12, 13, 14, 15, 16])");
    expect(panel).toContain("Verify your batch access code");
    expect(panel).toContain("Batch {batchNumber} is locked to this submission");
    expect(panel).toContain("status");
    expect(panel).toContain("Submit for review");
    expect(panel).not.toContain("BATCH_ACCESS_CODES_JSON");
  });

  it("adds the submission entry to Batch Detail and keeps approval controls Administrator-only", () => {
    const batchDetail = source("./pages/BatchDetail.tsx");
    const reviewQueue = source("./components/AdminBatchSubmissions.tsx");
    expect(batchDetail).toContain("<BatchSubmissionPanel batchNumber={batchNumber}/>");
    expect(reviewQueue).toContain("trpc.admin.batchSubmissions.list");
    expect(reviewQueue).toContain("Approve & publish");
    expect(reviewQueue).toContain("Only a Super Administrator");
  });
});
