import {
  and, applicationsRoundTable, courseRegistrationTable, courseTable, eq, inArray,
} from '@bluedot/db';
import { type inferRouterOutputs } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { unique } from './my-bluedot';

export type FacilitatorApplicationDecision = 'Accept' | 'Reject' | 'Withdrawn' | null;
export type FacilitatorApplicationRoundStatus = 'Active' | 'Future' | 'Past' | null;

export type FacilitatorApplicationListItem = inferRouterOutputs<typeof facilitatorApplicationsRouter>['list'][number];

export const facilitatorApplicationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const registrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(eq(courseRegistrationTable.pg.email, ctx.auth.email), eq(courseRegistrationTable.pg.role, 'Facilitator')));

    if (registrations.length === 0) return [];

    const courseIds = unique(registrations.map((r) => r.courseId));
    const roundIds = unique(registrations.map((r) => r.roundId));

    const [courses, rounds] = await Promise.all([
      courseIds.length === 0
        ? []
        : db.pg
          .select({
            id: courseTable.pg.id,
            title: courseTable.pg.title,
            slug: courseTable.pg.slug,
          })
          .from(courseTable.pg)
          .where(inArray(courseTable.pg.id, courseIds)),
      roundIds.length === 0
        ? []
        : db.pg
          .select({
            id: applicationsRoundTable.pg.id,
            firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
            lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
          })
          .from(applicationsRoundTable.pg)
          .where(inArray(applicationsRoundTable.pg.id, roundIds)),
    ]);

    const courseById = new Map(courses.map((c) => [c.id, c] as const));
    const roundById = new Map(rounds.map((r) => [r.id, r] as const));

    return registrations.map((r) => {
      const course = courseById.get(r.courseId) ?? null;
      const round = r.roundId ? (roundById.get(r.roundId) ?? null) : null;
      return {
        id: r.id,
        courseId: r.courseId,
        courseTitle: course?.title ?? null,
        courseSlug: course?.slug ?? null,
        roundId: r.roundId ?? null,
        roundName: r.roundName ?? null,
        roundFirstDiscussionDate: round?.firstDiscussionDate ?? null,
        roundLastDiscussionDate: round?.lastDiscussionDate ?? null,
        decision: (r.decision ?? null) as FacilitatorApplicationDecision,
        roundStatus: (r.roundStatus ?? null) as FacilitatorApplicationRoundStatus,
      };
    });
  }),
});
