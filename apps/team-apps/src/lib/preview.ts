// The public flag only enables fixtures in a development build. It is never an auth mode in production.
export const isLocalPreview = (): boolean => process.env.NODE_ENV === 'development'
  && process.env.NEXT_PUBLIC_LOCAL_PREVIEW === 'true';

export const PREVIEW_TOKEN = 'local-preview-synthetic-data';
export const PREVIEW_EMAIL = 'preview@bluedot.org';
