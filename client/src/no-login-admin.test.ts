import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("./pages/Admin.tsx", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("./pages/AdminLogin.tsx", import.meta.url), "utf8");

describe("credential-protected Admin access", () => {
  it("keeps the Login and Admin routes while gating dashboard access through the session query", () => {
    expect(appSource).toContain('path="/admin"');
    expect(appSource).toContain('path="/admin/login"');
    expect(appSource).toContain('path="/admin/:section"');
    expect(appSource).toContain("AdminAccessGate");
    expect(appSource).toContain("trpc.auth.me.useQuery");
    expect(mainSource).not.toContain("startLogin");
  });

  it("uses the active administrator session for dashboard identity and sign-out", () => {
    expect(adminSource).toContain("trpc.auth.logout.useMutation");
    expect(adminSource).toContain("auth.data?.role === \"admin\"");
  });

  it("submits credentials only through the secure sign-in mutation", () => {
    expect(loginSource).toContain("trpc.auth.signIn.useMutation");
    expect(loginSource).toContain('setLocation("/admin")');
    expect(loginSource).not.toContain("Sign-in is ready for the authentication backend.");
  });
});
