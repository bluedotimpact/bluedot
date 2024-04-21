import { validateEnv } from '../validateEnv';

// All of these must begin with 'NEXT_PUBLIC_' to distinguish them from server-side variables
const envVars = [
  'NEXT_PUBLIC_ZOOM_CLIENT_ID',
] as const;

export type Env = Record<(typeof envVars)[number], string>;

const env: Env = validateEnv({
  // This mapping is necessary as NextJS substitutes in the environments at build time for the frontend
  // https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser
  NEXT_PUBLIC_ZOOM_CLIENT_ID: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
}, envVars);

export default env;
