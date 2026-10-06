import { resolve } from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

const rootEnvPath = resolve(import.meta.dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  POSTGRES_HOST: z.string().min(1).default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535).default(5432),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),

  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().max(65535).default(6379),

  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(1025),
  MAIL_FROM: z.string().email().default('no-reply@qa-commerce.local'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalidFields = Object.keys(result.error.flatten().fieldErrors);
  throw new Error(`Invalid environment configuration. Check: ${invalidFields.join(', ')}`);
}

export const env = result.data;
export type AppEnv = z.infer<typeof envSchema>;
