import { describe, expect, it } from "vitest";
import { parseIncomingTextMessage, verifyWebhookChallenge } from "./parser";

describe("verifyWebhookChallenge", () => {
  it("returns the challenge when tokens match", () => {
    expect(
      verifyWebhookChallenge({
        mode: "subscribe",
        token: "secret",
        challenge: "12345",
        expectedToken: "secret",
      }),
    ).toBe("12345");
  });

  it("rejects invalid verification requests", () => {
    expect(() =>
      verifyWebhookChallenge({
        mode: "subscribe",
        token: "wrong",
        challenge: "12345",
        expectedToken: "secret",
      }),
    ).toThrow("Invalid webhook verification request");
  });
});

describe("parseIncomingTextMessage", () => {
  it("extracts a normalized WhatsApp text message", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "phone-1" },
                contacts: [{ wa_id: "905551112233", profile: { name: "Dr. Ada" } }],
                messages: [
                  {
                    id: "wamid.1",
                    from: "905551112233",
                    timestamp: "1785445200",
                    type: "text",
                    text: { body: "  SmileBot fiyatı nedir?  " },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(parseIncomingTextMessage(payload)).toEqual({
      externalMessageId: "wamid.1",
      phoneNumberId: "phone-1",
      senderPhone: "905551112233",
      senderName: "Dr. Ada",
      body: "SmileBot fiyatı nedir?",
      receivedAt: new Date(1785445200 * 1000).toISOString(),
    });
  });

  it("ignores delivery status payloads and unsupported message types", () => {
    expect(parseIncomingTextMessage({ object: "whatsapp_business_account", entry: [] })).toBeNull();
  });
});
