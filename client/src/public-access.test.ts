import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");

describe("public client access", () => {
  it("keeps public routes available and removes the administration route", () => {
    expect(appSource).toContain('path="/"');
    expect(appSource).toContain('path="/alumni"');
    expect(appSource).toContain('path="/batches"');
    expect(appSource).toContain('path="/districts"');
    expect(appSource).toContain('path="/jobs"');
    expect(appSource).not.toContain('path="/admin"');
    expect(appSource).not.toContain('pages/Admin');
  });

  it("does not launch OAuth or forward client session credentials", () => {
    expect(mainSource).not.toContain("startLogin");
    expect(mainSource).not.toContain("redirectToLoginIfUnauthorized");
    expect(mainSource).not.toContain("manus-cookie");
  });
});
