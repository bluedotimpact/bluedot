import path from 'path';
import { fileExists } from '../utils/fileExists';

const COURSE_OG_IMAGE_FILENAMES: Partial<Record<string, string>> = {
  'future-of-ai': 'future-of-ai-v2.png',
};

const COURSE_OG_IMAGE_FALLBACK = 'https://bluedot.org/images/logo/link-preview-fallback.png';

export const getCourseOgImage = async (courseSlug: string): Promise<string> => {
  const filename = COURSE_OG_IMAGE_FILENAMES[courseSlug] ?? `${courseSlug}.png`;

  if (await fileExists(path.join(process.cwd(), 'public', 'images', 'courses', 'link-preview', filename))) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
    return `${siteUrl}/images/courses/link-preview/${filename}`;
  }

  return COURSE_OG_IMAGE_FALLBACK;
};
