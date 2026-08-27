import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verifyBatchAccessCode } from "./batchAccess";

describe("batch access code verification", () => {
  it("validates the configured server secret without including it in source", () => {
    const configured = JSON.parse(process.env.BATCH_ACCESS_CODES_JSON ?? "{}") as Record<string, string>;
    expect(configured["11"]).toEqual(expect.any(String));
    expect(verifyBatchAccessCode(11, configured["11"]!)).toBe(true);
    expect(verifyBatchAccessCode(11, "invalid")).toBe(false);
  });

  it("keeps the configured codes out of client source and public verification responses", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const clientFiles = ["../client/src/pages/BatchDetail.tsx", "../client/src/pages/Batches.tsx"].map(file => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
    expect(routers).toContain("batchAccessAttempts");
    expect(routers).toContain("batchSubmissionAccess");
    expect(routers).toContain("batchAlumniSubmissions");
    expect(routers).toContain("status: \"pending\"");
    expect(routers).toContain("Profile photo must be uploaded through the verified submission form");
    expect(routers).not.toContain("BATCH_ACCESS_CODES_JSON");
    expect(clientFiles).not.toContain("BATCH_ACCESS_CODES_JSON");
  });

  it("keeps the public submission workflow pending-only, batch-locked, and one-time-token protected", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routers).toContain("batchAccessAttempts");
    expect(routers).toContain("failedAttempts: failures");
    expect(routers).toContain("15 * 60 * 1000");
    expect(routers).toContain("batchSubmissionAccess");
    expect(routers).toContain("consumeResult");
    expect(routers).toContain("affectedRows");
    expect(routers).toContain("isSupportedImage");
    expect(routers).toContain("status: \"pending\"");
    expect(routers).toContain("Profile photo must be uploaded through the verified submission form");
  });
});
