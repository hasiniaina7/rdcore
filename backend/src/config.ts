import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  RADIUS_BASE_URL: z.string().url(),
  RADIUS_TOKEN_LOCAL: z.string(),
  RADIUS_CLOUD_ID: z.string(),
  OMADA_BASE_URL: z.string().url(),
  OMADA_OPERATOR: z.string(),
  OMADA_PASSWORD: z.string(),
  PORTAL_PUBLIC_URL: z.string().url(),
  PORTAL_SUCCESS_URL: z.string().url(),
  LOG_LEVEL: z.string().default('info'),
  DEFAULT_LANGUAGE: z.string().default('fr_FR'),
  ENABLE_SSE_USAGE: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = parsed.data;

export type AppConfig = typeof config;

export default config;
