import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "./const";

describe("OAuth state", () => {
  it("preserves a same-site admin return path with the callback URI and CSRF nonce", () => {
    const state = encodeOAuthState({ redirectUri: "https://example.test/api/oauth/callback", nonce: "nonce-123", nextPath: "/admin" });
    expect(decodeOAuthState(state)).toEqual({ redirectUri: "https://example.test/api/oauth/callback", nonce: "nonce-123", nextPath: "/admin" });
  });

  it("rejects malformed state values without inventing a nonce", () => {
    expect(decodeOAuthState("not-base64").nonce).toBeUndefined();
  });
});
