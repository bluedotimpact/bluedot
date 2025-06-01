import { z } from 'zod';
import dotenv from 'dotenv';

// Copy semantics of NextJs:
// 1. Load .env
// 2. Load .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const envSchema = z.object({
  PG_URL: z.string(),
  AIRTABLE_PERSONAL_ACCESS_TOKEN: z.string(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  throw new Error(`Missing environment variables: ${parseResult.error.issues.map((i) => i.path).join(', ')}`);
}

export const env = parseResult.data;
