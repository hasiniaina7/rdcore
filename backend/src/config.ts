import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

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
  OMADA_EXTERNAL_PORTAL_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((value) => value === 'true'),
  LOG_LEVEL: z.string().default('info'),
  DEFAULT_LANGUAGE: z.string().default('fr_FR'),
  ENABLE_SSE_USAGE: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  ADMIN_AUTH_MODE: z.enum(['static', 'radiusmysql']).default('static'),
  ADMIN_STATIC_USER: z.string().optional().default('admin'),
  ADMIN_STATIC_PASSWORD: z.string().optional().default('change-me'),
  RADIUS_MYSQL_USER: z.string().optional().default(''),
  RADIUS_MYSQL_PASSWORD: z.string().optional().default(''),
  ADMIN_TOKEN_TTL_MINUTES: z.coerce.number().default(240),
  USAGE_SESSION_TTL_MINUTES: z.coerce.number().default(30),
  USAGE_SESSION_CACHE_SIZE: z.coerce.number().default(1000),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default(
      [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://192.168.4.244:5173',
        'http://192.168.4.244:5174',
        'https://hotspot.techzone.lat',
      ].join(',')
    ),
  RADIUS_HTTP_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = parsed.data;

export type AppConfig = typeof config;

export default config;
