import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;

  const providedHex = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(providedHex)) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const provided = Buffer.from(providedHex, "hex");

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
