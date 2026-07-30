import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  OPENAI_API_KEY: "openai-key",
  WHATSAPP_VERIFY_TOKEN: "verify-token",
  WHATSAPP_ACCESS_TOKEN: "whatsapp-token",
  WHATSAPP_PHONE_NUMBER_ID: "123456",
  META_APP_SECRET: "meta-secret",
  META_PIXEL_ID: "pixel-id",
  META_ACCESS_TOKEN: "meta-token",
};

describe("parseEnv", () => {
  it("rejects missing required credentials", () => {
    expect(() => parseEnv({})).toThrow();
  });

  it("rejects an invalid Supabase URL", () => {
    expect(() =>
      parseEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow();
  });

  it("returns a typed configuration for valid credentials", () => {
    const result = parseEnv(validEnv);
    expect(result.META_PIXEL_ID).toBe("pixel-id");
    expect(result.WHATSAPP_PHONE_NUMBER_ID).toBe("123456");
  });
});
