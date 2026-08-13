// This is the allowlist of grants with launched public pages. Funding records
// remain unlisted until their canonical route is deliberately added here.
export const GRANT_PATHS = {
  'career-transition-grant': '/grants/career-transition',
  'rapid-grants': '/grants/rapid',
} as const;

export const getGrantPath = (slug: string | null | undefined): string | undefined => (
  slug && slug in GRANT_PATHS
    ? GRANT_PATHS[slug as keyof typeof GRANT_PATHS]
    : undefined
);
