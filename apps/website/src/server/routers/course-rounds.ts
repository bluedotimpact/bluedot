import { z } from 'zod';
import {
  applicationsRoundTable, courseTable, courseRegistrationTable, eq, and, or, sql,
} from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';
import { formatApplicationDeadlineUtcDetailed, formatMonthAndDay } from '../../lib/utils';
import type { ApplyCTAProps } from '../../components/courses/SideBar';
import { ONE_DAY_MS } from '../../lib/constants';

export function getDeadlineThresholdUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  ));
}

function formatDateRange(
  firstDate: string | null,
  lastDate: string | null,
  numberOfUnits: number | null,
  intensity: string | null,
): string | null {
  if (!firstDate) return null;

  const first = new Date(firstDate);
  let computedLast: Date | null = null;

  if (numberOfUnits && numberOfUnits > 0) {
    const isPartTime = intensity?.toLowerCase() === 'part-time';
    const daysToAdd = isPartTime ? (numberOfUnits * 7) - 1 : numberOfUnits - 1;
    computedLast = new Date(first.getTime() + daysToAdd * ONE_DAY_MS);
  } else if (lastDate) {
    computedLast = new Date(lastDate);
  } else {
    return null;
  }

  const firstDay = String(first.getUTCDate());
  const lastDay = String(computedLast.getUTCDate());
  const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const lastMonth = computedLast.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

  return `${firstDay} ${firstMonth} \u2013 ${lastDay} ${lastMonth}`;
}

function compareRoundsByDateAndDuration(
  a: { firstDiscussionDateRaw: string | null; numberOfUnits: number | null },
  b: { firstDiscussionDateRaw: string | null; numberOfUnits: number | null },
): number {
  if (!a.firstDiscussionDateRaw && !b.firstDiscussionDateRaw) return 0;
  if (!a.firstDiscussionDateRaw) return 1;
  if (!b.firstDiscussionDateRaw) return -1;

  const aStart = new Date(a.firstDiscussionDateRaw).getTime();
  const bStart = new Date(b.firstDiscussionDateRaw).getTime();

  if (aStart === bStart) {
    return (a.numberOfUnits ?? Infinity) - (b.numberOfUnits ?? Infinity);
  }

  return aStart - bStart;
}

function groupByIntensity<T extends { intensity: string | null }>(rounds: T[]): { intense: T[]; partTime: T[] } {
  return {
    intense: rounds.filter((r) => r.intensity?.toLowerCase() === 'intensive'),
    partTime: rounds.filter((r) => r.intensity?.toLowerCase() === 'part-time'),
  };
}

/**
 * Fetches course rounds data by course slug.
 * This function is shared between the tRPC procedure and getStaticProps.
 */
export async function getCourseRoundsData(courseSlug: string) {
  const course = await db.pg
    .select({ id: courseTable.pg.id })
    .from(courseTable.pg)
    .where(eq(courseTable.pg.slug, courseSlug))
    .limit(1);

  if (!course.length || !course[0]) {
    return { intense: [], partTime: [] };
  }

  const courseId = course[0].id;

  // Only show rounds whose deadline is today or later in UTC.
  // This keeps the displayed "12 Apr" deadline visible until 00:00 UTC on 13 Apr.
  const deadlineThreshold = getDeadlineThresholdUtc();

  const filteredRounds = await db.pg
    .select()
    .from(applicationsRoundTable.pg)
    .where(and(
      eq(applicationsRoundTable.pg.courseId, courseId),
      or(
        sql`${applicationsRoundTable.pg.applicationDeadline} IS NULL`,
        sql`${applicationsRoundTable.pg.applicationDeadline}::timestamp >= ${deadlineThreshold.toISOString()}::timestamp`,
      ),
    ));

  const enrichedRounds = filteredRounds.map((round) => ({
    id: round.id,
    intensity: round.intensity,
    applicationDeadline: round.applicationDeadline ? formatMonthAndDay(round.applicationDeadline) : 'TBD',
    applicationDeadlineDetailed: round.applicationDeadline
      ? formatApplicationDeadlineUtcDetailed(round.applicationDeadline)
      : 'TBD',
    applicationDeadlineRaw: round.applicationDeadline,
    firstDiscussionDateRaw: round.firstDiscussionDate,
    dateRange: formatDateRange(
      round.firstDiscussionDate,
      round.lastDiscussionDate,
      round.numberOfUnits,
      round.intensity,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    ) || 'TBD',
    numberOfUnits: round.numberOfUnits,
  }));

  // Sort by start date (earliest first), then by duration (shorter first)
  enrichedRounds.sort(compareRoundsByDateAndDuration);

  return groupByIntensity(enrichedRounds);
}

export type CourseRoundsData = Awaited<ReturnType<typeof getCourseRoundsData>>;

/**
 * Finds the soonest upcoming application deadline across all rounds.
 * Returns the deadline in "DD MMM" format (e.g., "23 Feb"), or null if no valid deadline exists.
 */
export function getSoonestDeadline(rounds: CourseRoundsData): string | null {
  const allRounds = [...rounds.intense, ...rounds.partTime];

  const roundsWithDeadlines = allRounds.filter((r): r is typeof r & { applicationDeadlineRaw: string } => r.applicationDeadlineRaw !== null);

  if (roundsWithDeadlines.length === 0) {
    return null;
  }

  const soonestRound = roundsWithDeadlines.reduce((soonest, current) => {
    const soonestDate = new Date(soonest.applicationDeadlineRaw);
    const currentDate = new Date(current.applicationDeadlineRaw);
    return currentDate < soonestDate ? current : soonest;
  });

  return formatMonthAndDay(soonestRound.applicationDeadlineRaw);
}

export const courseRoundsRouter = router({
  getRoundsForCourse: publicProcedure
    .input(z.object({
      courseSlug: z.string(),
    }))
    .query(async ({ input }) => {
      return getCourseRoundsData(input.courseSlug);
    }),

  getAllUpcomingRounds: publicProcedure
    .query(async () => {
      // Get all active courses
      const allCourses = await db.pg
        .select({
          id: courseTable.pg.id,
          title: courseTable.pg.title,
          slug: courseTable.pg.slug,
          applyUrl: courseTable.pg.applyUrl,
        })
        .from(courseTable.pg)
        .where(eq(courseTable.pg.status, 'Active'));

      // Filter out self-paced courses (slug = 'future-of-ai')
      const courses = allCourses.filter((course) => course.slug !== 'future-of-ai');

      // Only show rounds whose deadline is today or later in UTC.
      const deadlineThreshold = getDeadlineThresholdUtc();

      // Fetch all upcoming rounds for all courses
      const allRounds = await db.pg
        .select()
        .from(applicationsRoundTable.pg)
        .where(or(
          sql`${applicationsRoundTable.pg.applicationDeadline} IS NULL`,
          sql`${applicationsRoundTable.pg.applicationDeadline}::timestamp >= ${deadlineThreshold.toISOString()}::timestamp`,
        ));

      // Create a map of courseId to course info
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      // Enrich rounds with course info and formatting
      const enrichedRounds = allRounds
        .map((round) => {
          if (!round.courseId) {
            return null;
          }

          const course = courseMap.get(round.courseId);
          if (!course) {
            return null;
          }

          return {
            id: round.id,
            courseId: round.courseId,
            courseTitle: course.title,
            courseSlug: course.slug,
            applyUrl: course.applyUrl,
            intensity: round.intensity,
            applicationDeadline: round.applicationDeadline
              ? formatMonthAndDay(round.applicationDeadline)
              : 'TBD',
            applicationDeadlineDetailed: round.applicationDeadline
              ? formatApplicationDeadlineUtcDetailed(round.applicationDeadline)
              : 'TBD',
            applicationDeadlineRaw: round.applicationDeadline,
            firstDiscussionDateRaw: round.firstDiscussionDate,
            dateRange: formatDateRange(
              round.firstDiscussionDate,
              round.lastDiscussionDate,
              round.numberOfUnits,
              round.intensity,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            ) || 'TBD',
            numberOfUnits: round.numberOfUnits,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Sort by start date (earliest first), then by duration (shorter first)
      enrichedRounds.sort(compareRoundsByDateAndDuration);

      return groupByIntensity(enrichedRounds);
    }),

  getApplyCTAProps: publicProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ ctx, input }): Promise<ApplyCTAProps | null> => {
      const { courseSlug } = input;

      // Get course with applyUrl from database
      const course = await db.pg
        .select({ id: courseTable.pg.id, applyUrl: courseTable.pg.applyUrl })
        .from(courseTable.pg)
        .where(eq(courseTable.pg.slug, courseSlug))
        .limit(1);

      if (!course.length || !course[0]?.applyUrl) {
        return null;
      }

      const { id: courseId, applyUrl: applicationUrl } = course[0];

      // Use shared functions for getting deadline
      const rounds = await getCourseRoundsData(courseSlug);
      const applicationDeadline = getSoonestDeadline(rounds);
      if (!applicationDeadline) {
        return null;
      }

      // Check if user has already applied (requires auth context)
      let hasApplied = false;
      if (ctx.auth?.email) {
        const result = await db.pg.execute<{ exists: boolean }>(sql`
          SELECT EXISTS (
            SELECT 1 FROM ${courseRegistrationTable.pg}
            WHERE ${courseRegistrationTable.pg.email} = ${ctx.auth.email}
            AND ${courseRegistrationTable.pg.courseId} = ${courseId}
          )
        `);
        hasApplied = result.rows[0]?.exists ?? false;
      }

      return {
        applicationDeadline,
        applicationUrl,
        hasApplied,
      };
    }),
});
