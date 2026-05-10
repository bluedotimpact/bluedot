const CERTIFICATE_ASSET_SLUG_BY_COURSE_SLUG: Record<string, string> = {
  'future-of-ai': 'future-of-ai',
  'ai-governance': 'ai-governance',
  'agi-strategy': 'agi-strategy',
  'technical-ai-safety': 'technical-ai-safety',
  biosecurity: 'biosecurity',
  'technical-ai-safety-project': 'technical-ai-safety',
};

export const DEFAULT_CERTIFICATE_BADGE_PATH = '/images/certificates/certificate-fallback-image.png';

export const getCertificateAssetSlug = (courseSlug: string): string | null => (
  CERTIFICATE_ASSET_SLUG_BY_COURSE_SLUG[courseSlug] ?? null
);

export const getCertificateBadgePath = (courseSlug: string): string => {
  const assetSlug = getCertificateAssetSlug(courseSlug);
  return assetSlug ? `/images/certificates/${assetSlug}.png` : DEFAULT_CERTIFICATE_BADGE_PATH;
};

export const getCertificateIconPath = (courseSlug: string): string | null => {
  const assetSlug = getCertificateAssetSlug(courseSlug);
  return assetSlug ? `/images/certificates/icons/${assetSlug}-icon.svg` : null;
};
