// Grant types with launched public pages. Each slug matches the `slug` of the
// grant type's row in the Airtable `program` table and its page URL
// (`/grants/<slug>`). Draft grant types stay unlinked until they're added here.
export const GRANT_TYPE_SLUGS = ['rapid', 'career-transition'] as const;

export type GrantTypeSlug = typeof GRANT_TYPE_SLUGS[number];

export const isGrantTypeSlug = (slug: string | null | undefined): slug is GrantTypeSlug => (
  (GRANT_TYPE_SLUGS as readonly (string | null | undefined)[]).includes(slug)
);

export const grantTypePath = (slug: GrantTypeSlug): string => `/grants/${slug}`;

export const getGrantPath = (slug: string | null | undefined): string | undefined => (
  isGrantTypeSlug(slug) ? grantTypePath(slug) : undefined
);
