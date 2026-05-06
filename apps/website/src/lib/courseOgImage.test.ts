import { describe, expect, test } from 'vitest';
import { getCourseOgImage } from './courseOgImage';

describe('getCourseOgImage', () => {
  test('uses the cache-busted Future of AI preview image', async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
    await expect(getCourseOgImage('future-of-ai')).resolves.toBe(`${siteUrl}/images/courses/link-preview/future-of-ai-v2.png`);
  });

  test('uses the default slug image when it exists', async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
    await expect(getCourseOgImage('biosecurity')).resolves.toBe(`${siteUrl}/images/courses/link-preview/biosecurity.png`);
  });

  test('falls back to the generic preview when a course image does not exist', async () => {
    await expect(getCourseOgImage('missing-course')).resolves.toBe('https://bluedot.org/images/logo/link-preview-fallback.png');
  });
});
