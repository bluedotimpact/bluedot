import {
  describe, expect, test,
} from 'vitest';
import {
  DEFAULT_CERTIFICATE_BADGE_PATH,
  getCertificateAssetSlug,
  getCertificateBadgePath,
  getCertificateIconPath,
} from './certificateAssets';

describe('certificateAssets', () => {
  test('uses Technical AI Safety artwork for the project certificate', () => {
    expect(getCertificateAssetSlug('technical-ai-safety-project')).toBe('technical-ai-safety');
    expect(getCertificateBadgePath('technical-ai-safety-project')).toBe('/images/certificates/technical-ai-safety.png');
    expect(getCertificateIconPath('technical-ai-safety-project')).toBe('/images/certificates/icons/technical-ai-safety-icon.svg');
  });

  test('falls back when a course has no certificate artwork', () => {
    expect(getCertificateAssetSlug('personal-theory-of-impact')).toBeNull();
    expect(getCertificateBadgePath('personal-theory-of-impact')).toBe(DEFAULT_CERTIFICATE_BADGE_PATH);
    expect(getCertificateIconPath('personal-theory-of-impact')).toBeNull();
  });
});
