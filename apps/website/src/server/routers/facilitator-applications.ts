import {
  and,
  applicationsCourseTable,
  applicationsRoundTable,
  courseRegistrationTable,
  courseTable,
  eq,
  groupDiscussionTable,
  inArray,
  meetPersonTable,
} from '@bluedot/db';
import { type inferRouterOutputs, TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { parseWeekFromRoundName, unique } from '../../lib/utils';
import { protectedProcedure, router } from '../trpc';
import { openRoundDeadlineCondition } from './course-rounds';

type FacilitatorApplicationDecision = 'Accept' | 'Reject' | 'Withdrawn' | null;
type FacilitatorApplicationRoundStatus = 'Active' | 'Future' | 'Past' | null;

const toDecision = (v: unknown): FacilitatorApplicationDecision =>
  v === 'Accept' || v === 'Reject' || v === 'Withdrawn' ? v : null;

const toRoundStatus = (v: unknown): FacilitatorApplicationRoundStatus =>
  v === 'Active' || v === 'Future' || v === 'Past' ? v : null;

const buildRoundLabel = (courseRoundIntensity: string | null, intensity: string | null): string => {
  const week = parseWeekFromRoundName(courseRoundIntensity);
  const label = [week !== null ? `Week ${week}` : null, intensity].filter(Boolean).join(' ');
  if (label) return label;
  return courseRoundIntensity ?? 'Upcoming round';
};

/**
 * Courses where the facilitator is wrapping up a cohort: a started cohort of theirs has
 * at most one discussion still in the future. Once a cohort reaches its final discussion
 * the course stays eligible (remaining only decreases), which gives the "appears then
 * persists" behaviour of the quick-apply panel. Cohorts with no assigned discussions yet
 * (not started) don't count. Shared with the future "facilitate again" sidebar (#2531).
 */
export const getQuickApplyEligibleCourseIds = async (email: string): Promise<string[]> => {
  const [registrations, meetPersons] = await Promise.all([
    db.pg
      .select({ id: courseRegistrationTable.pg.id, courseId: courseRegistrationTable.pg.courseId })
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        eq(courseRegistrationTable.pg.role, 'Facilitator'),
      )),
    db.pg
      .select({
        applicationsBaseRecordId: meetPersonTable.pg.applicationsBaseRecordId,
        expectedDiscussionsFacilitator: meetPersonTable.pg.expectedDiscussionsFacilitator,
      })
      .from(meetPersonTable.pg)
      .where(eq(meetPersonTable.pg.email, email)),
  ]);
  if (registrations.length === 0) return [];

  const discussionIds = unique(meetPersons.flatMap((mp) => mp.expectedDiscussionsFacilitator ?? []));
  if (discussionIds.length === 0) return [];

  const discussions = await db.pg
    .select({ id: groupDiscussionTable.pg.id, endDateTime: groupDiscussionTable.pg.endDateTime })
    .from(groupDiscussionTable.pg)
    .where(inArray(groupDiscussionTable.pg.id, discussionIds));
  const endById = new Map(discussions.map((d) => [d.id, d.endDateTime] as const));

  const meetPersonByRegId = new Map(meetPersons.map((mp) => [mp.applicationsBaseRecordId, mp] as const));
  const nowSec = Math.floor(Date.now() / 1000);

  const eligibleCourseIds = new Set<string>();
  for (const reg of registrations) {
    const assigned = meetPersonByRegId.get(reg.id)?.expectedDiscussionsFacilitator ?? [];
    if (assigned.length === 0) continue; // cohort not started / no schedule yet
    const futureCount = assigned.filter((id) => (endById.get(id) ?? 0) > nowSec).length;
    if (futureCount <= 1) eligibleCourseIds.add(reg.courseId);
  }

  return [...eligibleCourseIds];
};

const facilitatorApplicationAnswersSchema = z.object({
  numGroupsToFacilitate: z.number().int().min(1).max(10),
  formFeedback: z.string().optional(),
  prevEngagement: z.string().optional(),
  skills: z.string().optional(),
  impressiveProject: z.string().optional(),
  motivationToFacilitate: z.string().optional(),
  prevFacilitationExperience: z.string().optional(),
  availabilityIntervalsUTC: z.string().optional(),
  availabilityTimezone: z.string().optional(),
  availabilityComments: z.string().optional(),
});

// Fetches the open round, with courseId narrowed to non-null. Throws if the round doesn't exist or is no longer open.
const getOpenRound = async (roundId: string) => {
  const [round] = await db.pg
    .select({
      id: applicationsRoundTable.pg.id,
      courseId: applicationsRoundTable.pg.courseId,
      courseRoundIntensity: applicationsRoundTable.pg.courseRoundIntensity,
      intensity: applicationsRoundTable.pg.intensity,
      firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
      lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
    })
    .from(applicationsRoundTable.pg)
    .where(and(eq(applicationsRoundTable.pg.id, roundId), openRoundDeadlineCondition()))
    .limit(1);

  if (!round?.courseId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Round not found or no longer open' });

  return { ...round, courseId: round.courseId };
};

const getRoundContext = async (roundId: string) => {
  const round = await getOpenRound(roundId);

  const [course] = await db.pg
    .select({ title: courseTable.pg.title, slug: courseTable.pg.slug })
    .from(courseTable.pg)
    .where(eq(courseTable.pg.id, round.courseId))
    .limit(1);

  return {
    courseId: round.courseId,
    round: {
      id: round.id,
      courseTitle: course?.title ?? null,
      courseSlug: course?.slug ?? null,
      label: buildRoundLabel(round.courseRoundIntensity, round.intensity),
      firstDiscussionDate: round.firstDiscussionDate,
      lastDiscussionDate: round.lastDiscussionDate,
    },
  };
};

const getPriorFacilitatorRegs = async (email: string, courseId: string) => {
  const regs = await db.pg
    .select()
    .from(courseRegistrationTable.pg)
    .where(and(
      eq(courseRegistrationTable.pg.email, email),
      eq(courseRegistrationTable.pg.role, 'Facilitator'),
      eq(courseRegistrationTable.pg.courseId, courseId),
    ));
  // Sorts most recent first; when used for pre-filling, the most recent application is likely the most relevant and helpful to pre-fill from.
  return [...regs].sort((a, b) => (b.autoNumberId ?? 0) - (a.autoNumberId ?? 0));
};

type PriorFacilitatorReg = Awaited<ReturnType<typeof getPriorFacilitatorRegs>>[number];

const getEligiblePriorFacilitatorRegs = async (email: string, courseId: string, roundId: string) => {
  const eligibleCourseIds = await getQuickApplyEligibleCourseIds(email);
  if (!eligibleCourseIds.includes(courseId)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not currently eligible to quick apply for this course' });
  }

  const priorRegs = await getPriorFacilitatorRegs(email, courseId);
  if (priorRegs.length === 0) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You have not facilitated this course before' });
  }

  if (priorRegs.some((r) => r.roundId === roundId)) {
    throw new TRPCError({ code: 'CONFLICT', message: 'You have already applied to this round' });
  }

  return priorRegs;
};

// The resolved form of a prior application's answers: every field present (optional strings
// default to '', numGroupsToFacilitate to 1) so the client form can seed react-hook-form.
const buildPrefill = (reg: PriorFacilitatorReg) => ({
  numGroupsToFacilitate: reg.numGroupsToFacilitate ?? 1,
  formFeedback: reg.formFeedback ?? '',
  prevEngagement: reg.prevEngagement ?? '',
  skills: reg.skills ?? '',
  impressiveProject: reg.impressiveProject ?? '',
  motivationToFacilitate: reg.motivationToFacilitate ?? '',
  prevFacilitationExperience: reg.prevFacilitationExperience ?? '',
  availabilityIntervalsUTC: reg.availabilityIntervalsUTC ?? '',
  availabilityTimezone: reg.availabilityTimezone ?? '',
  availabilityComments: reg.availabilityComments ?? '',
});

export type FacilitatorApplicationListItem = inferRouterOutputs<typeof facilitatorApplicationsRouter>['list'][number];
export type EligibleRoundsCourse = inferRouterOutputs<typeof facilitatorApplicationsRouter>['eligibleRounds'][number];
export type QuickApplyPrefillData = inferRouterOutputs<typeof facilitatorApplicationsRouter>['quickApplyPrefill'];

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
        decision: toDecision(r.decision),
        roundStatus: toRoundStatus(r.roundStatus),
      };
    });
  }),

  // One card per course the facilitator is wrapping up that still has open upcoming rounds
  // they haven't applied to. Each card lists those rounds (earliest first).
  eligibleRounds: protectedProcedure.query(async ({ ctx }) => {
    const eligibleCourseIds = await getQuickApplyEligibleCourseIds(ctx.auth.email);
    if (eligibleCourseIds.length === 0) return [];

    const [existingRegs, courses, rounds] = await Promise.all([
      db.pg
        .select({ roundId: courseRegistrationTable.pg.roundId })
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.email, ctx.auth.email),
          eq(courseRegistrationTable.pg.role, 'Facilitator'),
        )),
      db.pg
        .select({ id: courseTable.pg.id, title: courseTable.pg.title, slug: courseTable.pg.slug })
        .from(courseTable.pg)
        .where(inArray(courseTable.pg.id, eligibleCourseIds)),
      db.pg
        .select({
          id: applicationsRoundTable.pg.id,
          courseId: applicationsRoundTable.pg.courseId,
          courseRoundIntensity: applicationsRoundTable.pg.courseRoundIntensity,
          intensity: applicationsRoundTable.pg.intensity,
          firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
          lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
        })
        .from(applicationsRoundTable.pg)
        .where(and(
          inArray(applicationsRoundTable.pg.courseId, eligibleCourseIds),
          openRoundDeadlineCondition(),
        )),
    ]);
    const appliedRoundIds = new Set(existingRegs.map((r) => r.roundId).filter((id): id is string => !!id));

    const courseById = new Map(courses.map((c) => [c.id, c] as const));
    const roundsByCourse = new Map<
      string,
      { id: string; label: string; firstDiscussionDate: string | null; lastDiscussionDate: string | null }[]
    >();
    for (const r of rounds) {
      if (!r.courseId || appliedRoundIds.has(r.id)) continue;
      const list = roundsByCourse.get(r.courseId) ?? [];
      list.push({
        id: r.id,
        label: buildRoundLabel(r.courseRoundIntensity, r.intensity),
        firstDiscussionDate: r.firstDiscussionDate,
        lastDiscussionDate: r.lastDiscussionDate,
      });
      roundsByCourse.set(r.courseId, list);
    }

    const byFirstDiscussionAsc = (
      a: { firstDiscussionDate: string | null },
      b: { firstDiscussionDate: string | null },
    ) => {
      if (!a.firstDiscussionDate && !b.firstDiscussionDate) return 0;
      if (!a.firstDiscussionDate) return 1;
      if (!b.firstDiscussionDate) return -1;
      return a.firstDiscussionDate.localeCompare(b.firstDiscussionDate);
    };

    return eligibleCourseIds
      .map((courseId) => {
        const course = courseById.get(courseId);
        const courseRounds = (roundsByCourse.get(courseId) ?? []).sort(byFirstDiscussionAsc);
        if (!course || courseRounds.length === 0) return null;
        return {
          courseId,
          courseTitle: course.title,
          courseSlug: course.slug,
          rounds: courseRounds,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }),

  // Round + course context and prefill (from the facilitator's most recent prior application
  // for the same course) for the quick-apply form. Validates eligibility, openness, no duplicate.
  quickApplyPrefill: protectedProcedure.input(z.object({ roundId: z.string() })).query(async ({ ctx, input }) => {
    const { round, courseId } = await getRoundContext(input.roundId);
    const priorRegs = await getEligiblePriorFacilitatorRegs(ctx.auth.email, courseId, input.roundId);

    const mostRecent = priorRegs[0] ?? null;
    const prefill = mostRecent ? buildPrefill(mostRecent) : null;

    return { round, prefill };
  }),

  quickApply: protectedProcedure
    .input(facilitatorApplicationAnswersSchema.extend({ roundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId } = await getOpenRound(input.roundId);
      await getEligiblePriorFacilitatorRegs(ctx.auth.email, courseId, input.roundId);

      // Link the application to its course via the Applications-base course record (courseId,
      // roundName and roundStatus are computed in Airtable from the linked round/course).
      const applicationsCourse = await db.getFirst(applicationsCourseTable, {
        sortBy: 'id',
        filter: { courseBuilderId: courseId },
      });
      if (!applicationsCourse) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course configuration not found for course: ${courseId}` });
      }

      return db.insert(courseRegistrationTable, {
        email: ctx.auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
        roundId: input.roundId,
        role: 'Facilitator',
        decision: null,
        source: 'quick-apply',
        numGroupsToFacilitate: input.numGroupsToFacilitate,
        formFeedback: input.formFeedback ?? null,
        prevEngagement: input.prevEngagement ?? null,
        skills: input.skills ?? null,
        impressiveProject: input.impressiveProject ?? null,
        motivationToFacilitate: input.motivationToFacilitate ?? null,
        prevFacilitationExperience: input.prevFacilitationExperience ?? null,
        availabilityIntervalsUTC: input.availabilityIntervalsUTC ?? null,
        availabilityTimezone: input.availabilityTimezone ?? null,
        availabilityComments: input.availabilityComments ?? null,
      });
    }),
});
