import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_PIXEL_ID: z.string().min(1),
  META_ACCESS_TOKEN: z.string().min(1),
});

export type GrowthOSEnv = z.infer<typeof envSchema>;

export function parseEnv(
  input: Record<string, string | undefined>,
): GrowthOSEnv {
  return envSchema.parse(input);
}

export function getServerEnv(): GrowthOSEnv {
  return parseEnv(process.env);
}
