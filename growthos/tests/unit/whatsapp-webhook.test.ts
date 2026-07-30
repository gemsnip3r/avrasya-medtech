import { describe, expect, it } from "vitest";
import { parseIncomingMessage, verifyWebhook } from "@/lib/whatsapp/webhook";

const samplePayload = {
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "12345" },
            messages: [
              {
                id: "wamid.1",
                from: "905551112233",
                timestamp: "1785432000",
                text: { body: " SmileBot hakkında bilgi almak istiyorum " },
              },
            ],
          },
        },
      ],
    },
  ],
};

describe("verifyWebhook", () => {
  it("returns the challenge for a valid verification request", () => {
    expect(verifyWebhook("subscribe", "correct", "123", "correct")).toBe("123");
  });

  it("rejects an invalid token", () => {
    expect(() => verifyWebhook("subscribe", "wrong", "123", "correct")).toThrow();
  });
});

describe("parseIncomingMessage", () => {
  it("extracts a text message from a WhatsApp webhook", () => {
    expect(parseIncomingMessage(samplePayload)).toEqual({
      messageId: "wamid.1",
      senderId: "905551112233",
      phoneNumberId: "12345",
      text: "SmileBot hakkında bilgi almak istiyorum",
      timestamp: "1785432000",
    });
  });

  it("returns null for delivery status payloads", () => {
    expect(parseIncomingMessage({ entry: [{ changes: [{ value: { statuses: [] } }] }] })).toBeNull();
  });
});
