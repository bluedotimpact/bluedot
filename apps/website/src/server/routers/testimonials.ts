import { testimonialTable, type Testimonial } from '@bluedot/db';
import type { Quote } from '@bluedot/ui';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';
import type { CommunityMember } from '../../components/lander/CommunityCarousel';

export function sortTestimonials(items: Testimonial[]): Testimonial[] {
  return items.sort((a, b) => {
    if (a.isPrioritised !== b.isPrioritised) {
      return b.isPrioritised ? 1 : -1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function toQuote(t: Testimonial): Quote {
  return {
    quote: t.testimonialText!,
    name: t.name!,
    imageSrc: t.headshotAttachmentUrls![0]!,
    role: t.jobTitle ?? undefined,
  };
}

export function toCommunityMember(t: Testimonial): CommunityMember {
  return {
    name: t.name!,
    jobTitle: t.jobTitle ?? '',
    course: t.bluedotEngagement ?? '',
    imageSrc: t.headshotAttachmentUrls![0]!,
    url: t.profileUrl ?? undefined,
  };
}

export const testimonialsRouter = router({
  // For CommunityMember usage on homepage - doesn't require testimonialText
  getCommunityMembers: publicProcedure.query(async () => {
    const all = await db.scan(testimonialTable);
    const filtered = all.filter((t) => t.name && t.headshotAttachmentUrls?.[0]);
    return sortTestimonials(filtered);
  }),

  // For CommunityMember usage on course pages - filtered by courseSlug
  getCommunityMembersByCourseSlug: publicProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ input }) => {
      const all = await db.scan(testimonialTable);
      const filtered = all.filter((t) => t.name
        && t.headshotAttachmentUrls?.[0]
        && t.displayOnCourseSlugs?.includes(input.courseSlug));
      return sortTestimonials(filtered);
    }),
});
