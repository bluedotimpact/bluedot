import { z } from 'zod';
import {
  applicationsRoundTable, courseTable, courseRegistrationTable, eq, and, or, sql,
} from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';
import { formatMonthAndDay } from '../../lib/utils';
import type { ApplyCTAProps } from '../../components/courses/SideBar';

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

  // Only show rounds where deadline hasn't passed everywhere in the world
  // Subtract 12 hours from current time to account for UTC-12 (furthest behind timezone)
  const now = new Date();
  const deadlineThreshold = new Date(now.getTime() - (12 * 60 * 60 * 1000));

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

  // Format date range based on firstDiscussionDate and numberOfUnits.
  // numberOfUnits = number of days (intensive) or weeks (part-time).
  // Falls back to lastDiscussionDate when units are missing.
  const formatDateRange = (
    firstDate: string | null,
    lastDate: string | null,
    numberOfUnits: number | null,
    intensity: string | null,
  ) => {
    if (!firstDate) {
      return null;
    }

    const first = new Date(firstDate);
    let computedLast: Date | null = null;

    if (numberOfUnits && numberOfUnits > 0) {
      const isPartTime = intensity?.toLowerCase() === 'part-time';
      // Part-time: numberOfUnits weeks. Intensive: numberOfUnits days.
      const daysToAdd = isPartTime ? (numberOfUnits * 7) - 1 : numberOfUnits - 1;
      computedLast = new Date(first.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    } else if (lastDate) {
      computedLast = new Date(lastDate);
    } else {
      return null;
    }

    const firstDay = String(first.getUTCDate());
    const lastDay = String(computedLast.getUTCDate());
    const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const lastMonth = computedLast.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

    return `${firstDay} ${firstMonth} - ${lastDay} ${lastMonth}`;
  };

  const enrichedRounds = filteredRounds.map((round) => ({
    id: round.id,
    intensity: round.intensity,
    applicationDeadline: round.applicationDeadline ? formatMonthAndDay(round.applicationDeadline) : 'TBD',
    applicationDeadlineRaw: round.applicationDeadline,
    firstDiscussionDateRaw: round.firstDiscussionDate,
    dateRange: formatDateRange(
      round.firstDiscussionDate,
      round.lastDiscussionDate,
      round.numberOfUnits,
      round.intensity,
    ) || 'TBD',
    numberOfUnits: round.numberOfUnits,
  }));

  // Sort by start date (earliest first), then by duration (shorter first)
  enrichedRounds.sort((a, b) => {
    if (!a.firstDiscussionDateRaw && !b.firstDiscussionDateRaw) {
      return 0;
    }

    if (!a.firstDiscussionDateRaw) {
      return 1;
    }

    if (!b.firstDiscussionDateRaw) {
      return -1;
    }

    const aStartDate = new Date(a.firstDiscussionDateRaw).getTime();
    const bStartDate = new Date(b.firstDiscussionDateRaw).getTime();

    if (aStartDate === bStartDate) {
      return (a.numberOfUnits ?? Infinity) - (b.numberOfUnits ?? Infinity);
    }

    return aStartDate - bStartDate;
  });

  return {
    intense: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'intensive'),
    partTime: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'part-time'),
  };
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

  return soonestRound.applicationDeadline;
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

      // Only show rounds where deadline hasn't passed everywhere in the world
      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() - (12 * 60 * 60 * 1000));

      // Fetch all upcoming rounds for all courses
      const allRounds = await db.pg
        .select()
        .from(applicationsRoundTable.pg)
        .where(or(
          sql`${applicationsRoundTable.pg.applicationDeadline} IS NULL`,
          sql`${applicationsRoundTable.pg.applicationDeadline}::timestamp >= ${deadlineThreshold.toISOString()}::timestamp`,
        ));

      // Format date range with en-dash
      const formatDateRange = (
        firstDate: string | null,
        lastDate: string | null,
        numberOfUnits: number | null,
        intensity: string | null,
      ) => {
        if (!firstDate) {
          return null;
        }

        const first = new Date(firstDate);

        let computedLast: Date | null = null;

        if (numberOfUnits && numberOfUnits > 0) {
          const isPartTime = intensity?.toLowerCase() === 'part-time';

          let daysToAdd: number;
          if (isPartTime) {
            daysToAdd = (numberOfUnits * 7) - 1;
          } else {
            daysToAdd = numberOfUnits - 1;
          }

          computedLast = new Date(first.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        } else if (lastDate) {
          computedLast = new Date(lastDate);
        } else {
          return null;
        }

        const firstDay = String(first.getUTCDate());
        const lastDay = String(computedLast.getUTCDate());
        const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const lastMonth = computedLast.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

        return `${firstDay} ${firstMonth} – ${lastDay} ${lastMonth}`;
      };

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
            applicationDeadlineRaw: round.applicationDeadline,
            firstDiscussionDateRaw: round.firstDiscussionDate,
            dateRange: formatDateRange(
              round.firstDiscussionDate,
              round.lastDiscussionDate,
              round.numberOfUnits,
              round.intensity,
            ) || 'TBD',
            numberOfUnits: round.numberOfUnits,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Sort by start date (earliest first), then by duration (shorter first)
      enrichedRounds.sort((a, b) => {
        if (!a.firstDiscussionDateRaw && !b.firstDiscussionDateRaw) {
          return 0;
        }

        if (!a.firstDiscussionDateRaw) {
          return 1;
        }

        if (!b.firstDiscussionDateRaw) {
          return -1;
        }

        const aStartDate = new Date(a.firstDiscussionDateRaw).getTime();
        const bStartDate = new Date(b.firstDiscussionDateRaw).getTime();

        if (aStartDate === bStartDate) {
          const aUnits = a.numberOfUnits ?? Infinity;
          const bUnits = b.numberOfUnits ?? Infinity;
          return aUnits - bUnits;
        }

        return aStartDate - bStartDate;
      });

      // Group by intensity type
      const grouped = {
        intense: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'intensive'),
        partTime: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'part-time'),
      };

      return grouped;
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
