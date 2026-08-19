import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");

describe("direct Admin access", () => {
  it("keeps the Admin routes while omitting a client login launcher", () => {
    expect(appSource).toContain('path="/admin"');
    expect(appSource).toContain('path="/admin/:section"');
    expect(mainSource).not.toContain("startLogin");
    expect(mainSource).not.toContain("redirectToLoginIfUnauthorized");
    expect(mainSource).not.toContain("manus-cookie");
  });

  it("does not render authentication or role-gate screens in the Admin entry page", () => {
    expect(adminSource).not.toContain("useAuth");
    expect(adminSource).not.toContain("Admin approval required");
    expect(adminSource).toContain('adminName="Administrator"');
  });
});
