import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "./signature";

describe("verifyMetaSignature", () => {
  it("accepts a valid sha256 signature", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const secret = "app-secret";
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyMetaSignature(body, signature, secret)).toBe(true);
  });

  it("rejects missing or malformed signatures", () => {
    expect(verifyMetaSignature("{}", null, "secret")).toBe(false);
    expect(verifyMetaSignature("{}", "sha1=wrong", "secret")).toBe(false);
  });

  it("rejects signatures created for a different body", () => {
    const signature = `sha256=${createHmac("sha256", "secret").update("{}").digest("hex")}`;
    expect(verifyMetaSignature('{"changed":true}', signature, "secret")).toBe(false);
  });
});
