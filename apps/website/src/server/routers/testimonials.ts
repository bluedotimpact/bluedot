import { testimonialTable, type Testimonial } from '@bluedot/db';
import type { Quote } from '@bluedot/ui';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export function sortTestimonials(items: Testimonial[]): Testimonial[] {
  return [...items].sort((a, b) => {
    const aPriority = !!a.isPrioritised;
    const bPriority = !!b.isPrioritised;
    if (aPriority !== bPriority) {
      return bPriority ? 1 : -1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function toQuote(t: Testimonial): Quote {
  // TODO: Remove Array.isArray check once database schema is synced to use text instead of text[]
  const headshot = t.headshotAttachmentUrls;
  const imageSrc = Array.isArray(headshot) ? headshot[0] : headshot?.split(' ')[0] ?? '';

  return {
    quote: t.testimonialText!,
    name: t.name!,
    imageSrc,
    role: t.jobTitle ?? undefined,
  };
}

export const testimonialsRouter = router({
  getCommunityMembers: publicProcedure.query(async () => {
    const all = await db.scan(testimonialTable);
    const filtered = all.filter((t) => t.name && t.headshotAttachmentUrls && t.testimonialText);
    return sortTestimonials(filtered);
  }),

  getCommunityMembersByCourseSlug: publicProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ input }) => {
      const all = await db.scan(testimonialTable);
      const filtered = all.filter((t) => t.name
        && t.headshotAttachmentUrls
        && t.testimonialText
        && t.displayOnCourseSlugs?.includes(input.courseSlug));
      return sortTestimonials(filtered);
    }),
});
