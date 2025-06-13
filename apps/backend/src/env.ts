import { z } from 'zod';

const envSchema = z.object({
  DATABASE_CONNECTION_STRING: z.string(),
});

const localDefaults: z.TypeOf<typeof envSchema> = {
  DATABASE_CONNECTION_STRING: 'postgresql://postgres:postgres@localhost:5432/postgres',
};

// eslint-disable-next-line turbo/no-undeclared-env-vars
const constructedEnv = process.env.NODE_ENV === 'development' ? { ...process.env, ...localDefaults } : process.env;
const parseResult = envSchema.safeParse(constructedEnv);

if (!parseResult.success) {
  throw new Error(`Missing environment variables: ${parseResult.error.issues.map((i) => i.path).join(', ')}`);
}

export const env = parseResult.data;
