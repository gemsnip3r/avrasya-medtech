import type { IncomingWhatsAppMessage } from "./types";

export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedToken: string,
): string {
  if (mode !== "subscribe" || token !== expectedToken || !challenge) {
    throw new Error("Invalid WhatsApp webhook verification request");
  }

  return challenge;
}

export function parseIncomingMessage(payload: unknown): IncomingWhatsAppMessage | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const entry = Array.isArray(root.entry) ? root.entry[0] : null;
  if (!entry || typeof entry !== "object") return null;

  const changes = (entry as Record<string, unknown>).changes;
  const change = Array.isArray(changes) ? changes[0] : null;
  if (!change || typeof change !== "object") return null;

  const value = (change as Record<string, unknown>).value;
  if (!value || typeof value !== "object") return null;

  const valueRecord = value as Record<string, unknown>;
  const metadata = valueRecord.metadata;
  const messages = valueRecord.messages;
  const message = Array.isArray(messages) ? messages[0] : null;

  if (!metadata || typeof metadata !== "object" || !message || typeof message !== "object") {
    return null;
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const messageRecord = message as Record<string, unknown>;
  const text = messageRecord.text;

  if (!text || typeof text !== "object") return null;
  const body = (text as Record<string, unknown>).body;

  if (
    typeof messageRecord.id !== "string" ||
    typeof messageRecord.from !== "string" ||
    typeof messageRecord.timestamp !== "string" ||
    typeof metadataRecord.phone_number_id !== "string" ||
    typeof body !== "string"
  ) {
    return null;
  }

  return {
    messageId: messageRecord.id,
    senderId: messageRecord.from,
    phoneNumberId: metadataRecord.phone_number_id,
    text: body.trim(),
    timestamp: messageRecord.timestamp,
  };
}
