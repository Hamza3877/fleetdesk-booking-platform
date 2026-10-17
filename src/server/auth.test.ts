import { describe, expect, it } from "vitest";
import { checkCredentials, createSessionToken, verifySessionToken } from "@/server/auth";

describe("auth", () => {
  it("accepts the right credentials and rejects wrong ones", () => {
    expect(checkCredentials("owner@fleetdesk.dev", "demo1234")).toBe(true);
    expect(checkCredentials("owner@fleetdesk.dev", "wrong")).toBe(false);
    expect(checkCredentials("someone@else.com", "demo1234")).toBe(false);
  });

  it("verifies a token it created", () => {
    const token = createSessionToken("owner@fleetdesk.dev");
    expect(verifySessionToken(token)).toEqual({ email: "owner@fleetdesk.dev" });
  });

  it("rejects a tampered token", () => {
    const [payload, signature] = createSessionToken("owner@fleetdesk.dev").split(".");
    const forged = Buffer.from(JSON.stringify({ email: "hacker@evil.com", exp: Date.now() + 100000 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${signature}`)).toBeNull();
    expect(verifySessionToken(`${payload}.bad-signature`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createSessionToken("owner@fleetdesk.dev", Date.now() - 1000 * 60 * 60 * 24);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects missing tokens", () => {
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
  });
});
