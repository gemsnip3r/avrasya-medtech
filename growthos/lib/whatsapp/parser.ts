type VerificationInput = {
  mode: string | null;
  token: string | null;
  challenge: string | null;
  expectedToken: string;
};

export type IncomingWhatsAppMessage = {
  externalMessageId: string;
  phoneNumberId: string;
  senderPhone: string;
  senderName: string | null;
  body: string;
  receivedAt: string;
};

export function verifyWebhookChallenge(input: VerificationInput): string {
  if (
    input.mode !== "subscribe" ||
    !input.challenge ||
    !input.token ||
    input.token !== input.expectedToken
  ) {
    throw new Error("Invalid webhook verification request");
  }

  return input.challenge;
}

export function parseIncomingTextMessage(payload: unknown): IncomingWhatsAppMessage | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const entry = Array.isArray(root.entry) ? root.entry[0] : null;
  if (!entry || typeof entry !== "object") return null;

  const changes = Array.isArray((entry as Record<string, unknown>).changes)
    ? ((entry as Record<string, unknown>).changes as unknown[])
    : [];
  const change = changes[0];
  if (!change || typeof change !== "object") return null;

  const value = (change as Record<string, unknown>).value;
  if (!value || typeof value !== "object") return null;
  const valueRecord = value as Record<string, unknown>;

  const messages = Array.isArray(valueRecord.messages) ? valueRecord.messages : [];
  const message = messages[0];
  if (!message || typeof message !== "object") return null;

  const messageRecord = message as Record<string, unknown>;
  if (messageRecord.type !== "text") return null;

  const text = messageRecord.text;
  const body =
    text && typeof text === "object"
      ? String((text as Record<string, unknown>).body ?? "").trim()
      : "";
  if (!body) return null;

  const metadata = valueRecord.metadata;
  const phoneNumberId =
    metadata && typeof metadata === "object"
      ? String((metadata as Record<string, unknown>).phone_number_id ?? "")
      : "";

  const contacts = Array.isArray(valueRecord.contacts) ? valueRecord.contacts : [];
  const contact = contacts[0];
  const profile =
    contact && typeof contact === "object"
      ? (contact as Record<string, unknown>).profile
      : null;
  const senderName =
    profile && typeof profile === "object"
      ? String((profile as Record<string, unknown>).name ?? "") || null
      : null;

  const timestamp = Number(messageRecord.timestamp);
  const senderPhone = String(messageRecord.from ?? "");
  const externalMessageId = String(messageRecord.id ?? "");

  if (!phoneNumberId || !senderPhone || !externalMessageId || !Number.isFinite(timestamp)) {
    return null;
  }

  return {
    externalMessageId,
    phoneNumberId,
    senderPhone,
    senderName,
    body,
    receivedAt: new Date(timestamp * 1000).toISOString(),
  };
}
