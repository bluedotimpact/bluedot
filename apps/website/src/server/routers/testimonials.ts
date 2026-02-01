import { testimonialTable, type Testimonial } from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

function sortTestimonials(items: Testimonial[]): Testimonial[] {
  return [...items].sort((a, b) => {
    // 1. Prioritised items first
    const aPriority = !!a.isPrioritised;
    const bPriority = !!b.isPrioritised;
    if (aPriority !== bPriority) {
      return bPriority ? 1 : -1;
    }

    // 2. Items with quotes before those without
    const aHasQuote = !!(a.testimonialText && a.testimonialText.trim());
    const bHasQuote = !!(b.testimonialText && b.testimonialText.trim());
    if (aHasQuote !== bHasQuote) {
      return bHasQuote ? 1 : -1;
    }

    // 3. Alphabetical by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

// TODO: Remove Array.isArray check once database schema is synced to use text instead of text[]
function getFirstHeadshotUrl(headshotAttachmentUrls: string | string[] | null): string {
  if (!headshotAttachmentUrls) return '';
  if (Array.isArray(headshotAttachmentUrls)) return headshotAttachmentUrls[0] ?? '';
  return headshotAttachmentUrls.split(' ')[0] ?? '';
}

export type TransformedTestimonial = {
  name: string;
  jobTitle: string;
  imageSrc: string;
  url?: string;
  quote: string;
};

function transformTestimonial(t: Testimonial): TransformedTestimonial {
  return {
    name: t.name!,
    jobTitle: t.jobTitle ?? '',
    imageSrc: getFirstHeadshotUrl(t.headshotAttachmentUrls),
    url: t.profileUrl ?? undefined,
    quote: t.testimonialText ?? '',
  };
}

export const testimonialsRouter = router({
  getCommunityMembers: publicProcedure.query(async () => {
    const all = await db.scan(testimonialTable);
    const filtered = all.filter((t) => t.name
      && getFirstHeadshotUrl(t.headshotAttachmentUrls)
      && t.testimonialText?.trim());
    return sortTestimonials(filtered).map(transformTestimonial);
  }),

  getCommunityMembersByCourseSlug: publicProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ input }) => {
      const all = await db.scan(testimonialTable);
      const filtered = all.filter((t) => t.name
        && getFirstHeadshotUrl(t.headshotAttachmentUrls)
        && t.testimonialText?.trim()
        && t.displayOnCourseSlugs?.includes(input.courseSlug));
      return sortTestimonials(filtered).map(transformTestimonial);
    }),
});
