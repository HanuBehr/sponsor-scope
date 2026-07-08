import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const twitchEnvSchema = z.object({
  TWITCH_CLIENT_ID: z.string().min(1, "TWITCH_CLIENT_ID is required"),
  TWITCH_CLIENT_SECRET: z.string().min(1, "TWITCH_CLIENT_SECRET is required"),
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
