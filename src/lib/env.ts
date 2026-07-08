import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const twitchEnvSchema = z.object({
  TWITCH_CLIENT_ID: z.string().min(1, "TWITCH_CLIENT_ID is required"),
  TWITCH_CLIENT_SECRET: z.string().min(1, "TWITCH_CLIENT_SECRET is required"),
});

const googleSheetsEnvSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email("GOOGLE_SERVICE_ACCOUNT_EMAIL must be a service account email"),
  GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1, "GOOGLE_SHEETS_SPREADSHEET_ID is required"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});

export function getTwitchEnv() {
  return twitchEnvSchema.parse({
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
  });
}

export function getGoogleSheetsEnv() {
  const parsed = googleSheetsEnvSchema.parse({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  });

  return {
    ...parsed,
    GOOGLE_PRIVATE_KEY: parsed.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}
