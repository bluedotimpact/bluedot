import { validateEnv } from '../validateEnv';

const envVars = [
  'BUBBLE_SHARED_SECRET',
  'KEYCLOAK_CLIENT_SECRET',

  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
] as const;

export type Env = Record<(typeof envVars)[number], string>;

const env: Env = validateEnv(process.env, envVars);

export default env;
