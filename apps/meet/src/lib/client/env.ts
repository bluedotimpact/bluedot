import { validateEnv } from '@bluedot/ui';

export default validateEnv({
  required: [
    'NEXT_PUBLIC_ZOOM_CLIENT_ID',
  ],
  envSource: {
    // This mapping is necessary as NextJS substitutes in the environments at build time for the frontend
    // https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser
    NEXT_PUBLIC_ZOOM_CLIENT_ID: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
  },
});
