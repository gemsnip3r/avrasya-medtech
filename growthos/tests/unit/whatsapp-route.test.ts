import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabase = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc: mockSupabase.rpc }),
}));

import { GET, POST } from "@/app/api/webhooks/whatsapp/route";

const secret = "meta-app-secret";

const incomingTextPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "phone-123" },
            contacts: [{ wa_id: "905551112233", profile: { name: "Ada Yilmaz" } }],
            messages: [
              {
                id: "wamid.unique-message",
                from: "905551112233",
                timestamp: "1785445200",
                type: "text",
                text: { body: "  Fiyat bilgisi alabilir miyim?  " },
              },
            ],
          },
        },
      ],
    },
  ],
};

function signedRequest(payload: unknown, signatureSecret = secret) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", signatureSecret).update(body).digest("hex");

  return new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
    method: "POST",
    headers: { "x-hub-signature-256": `sha256=${signature}` },
    body,
  });
}

describe("WhatsApp webhook route", () => {
  beforeEach(() => {
    process.env.WHATSAPP_VERIFY_TOKEN = "verify-token";
    process.env.META_APP_SECRET = secret;
    mockSupabase.rpc.mockReset();
  });

  it("returns Meta's challenge only for a matching verification token", async () => {
    const valid = await GET(
      new NextRequest(
        "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=challenge-123",
      ),
    );
    const invalid = await GET(
      new NextRequest(
        "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123",
      ),
    );

    expect(valid.status).toBe(200);
    await expect(valid.text()).resolves.toBe("challenge-123");
    expect(invalid.status).toBe(403);
  });

  it("rejects a POST with a forged Meta signature", async () => {
    const response = await POST(signedRequest(incomingTextPayload, "wrong-secret"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("ignores signed delivery-status payloads without attempting ingestion", async () => {
    const response = await POST(
      signedRequest({
        object: "whatsapp_business_account",
        entry: [{ changes: [{ value: { statuses: [{ id: "wamid.status" }] } }] }],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, ignored: true });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("passes a signed text message to the ingestion RPC and returns its created records", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        duplicate: false,
        lead_id: "lead-1",
        conversation_id: "conversation-1",
        message_id: "message-1",
      },
      error: null,
    });

    const response = await POST(signedRequest(incomingTextPayload));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: false,
      leadId: "lead-1",
      conversationId: "conversation-1",
    });
    expect(mockSupabase.rpc).toHaveBeenCalledWith("ingest_whatsapp_text_message", {
      p_phone_number_id: "phone-123",
      p_external_message_id: "wamid.unique-message",
      p_sender_phone: "905551112233",
      p_sender_name: "Ada Yilmaz",
      p_body: "Fiyat bilgisi alabilir miyim?",
      p_received_at: "2026-07-30T21:00:00.000Z",
    });
  });

  it("reports the second delivery of an external message ID as a duplicate", async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: { duplicate: false, lead_id: "lead-1", conversation_id: "conversation-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { duplicate: true, lead_id: "lead-1", conversation_id: "conversation-1" },
        error: null,
      });

    const first = await POST(signedRequest(incomingTextPayload));
    const duplicate = await POST(signedRequest(incomingTextPayload));

    await expect(first.json()).resolves.toMatchObject({ received: true, duplicate: false });
    await expect(duplicate.json()).resolves.toMatchObject({ received: true, duplicate: true });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });
});
