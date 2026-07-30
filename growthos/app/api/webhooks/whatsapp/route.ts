import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  parseIncomingTextMessage,
  verifyWebhookChallenge,
} from "@/lib/whatsapp/parser";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const challenge = verifyWebhookChallenge({
      mode: searchParams.get("hub.mode"),
      token: searchParams.get("hub.verify_token"),
      challenge: searchParams.get("hub.challenge"),
      expectedToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    });

    return new NextResponse(challenge, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = parseIncomingTextMessage(payload);

  // Meta expects a fast 200 response for status updates and unsupported message types.
  if (!message) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("ingest_whatsapp_text_message", {
    p_phone_number_id: message.phoneNumberId,
    p_external_message_id: message.externalMessageId,
    p_sender_phone: message.senderPhone,
    p_sender_name: message.senderName,
    p_body: message.body,
    p_received_at: message.receivedAt,
  });

  if (error) {
    console.error("WhatsApp ingestion failed", {
      code: error.code,
      message: error.message,
      externalMessageId: message.externalMessageId,
    });

    return NextResponse.json({ error: "Webhook ingestion failed" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    received: true,
    duplicate: Boolean(result?.duplicate),
    leadId: result?.lead_id ?? null,
    conversationId: result?.conversation_id ?? null,
  });
}
