# GrowthOS

Avrasya MedTech i?in WhatsApp, CRM ve sat?? operasyonlar?n? birle?tiren Next.js MVP'si.

## Yerel kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` i?indeki Supabase ve Meta/WhatsApp de?erlerini kendi geli?tirme ortam?n?zla doldurun. Ger?ek secret'lar? repoya eklemeyin.

## Supabase migration

Supabase projenize s?rayla ?u migration'lar? uygulay?n:

```text
supabase/migrations/0001_growthos_core.sql
supabase/migrations/0002_whatsapp_ingestion.sql
```

`whatsapp_channels` tablosunda, Meta Phone Number ID ile etkin bir kanal ve ili?kilendirilmi? organizasyon kayd? olmal?d?r.

## Do?rulama ve geli?tirme

```bash
npm run test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Uygulama `http://localhost:3000` ?zerinde a??l?r.

## WhatsApp webhook

Meta webhook URL'si:

```text
https://<public-host>/api/webhooks/whatsapp
```

GET do?rulamas? `WHATSAPP_VERIFY_TOKEN` ile yap?l?r. POST ?a?r?lar? `META_APP_SECRET` ile ?retilmi? `X-Hub-Signature-256` HMAC-SHA256 imzas?n? ta??mal?d?r.
