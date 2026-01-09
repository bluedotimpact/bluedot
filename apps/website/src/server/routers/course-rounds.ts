import { z } from 'zod';
import {
  applicationsRoundTable, courseTable, eq, and, or, sql,
} from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';

export const courseRoundsRouter = router({
  getRoundsForCourse: publicProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // Get the course by slug
      const course = await db.pg
        .select({ id: courseTable.pg.id })
        .from(courseTable.pg)
        .where(eq(courseTable.pg.slug, input.courseSlug))
        .limit(1);

      // If course not found, return empty result
      if (!course.length || !course[0]) {
        return { intense: [], partTime: [] };
      }

      const courseId = course[0].id;

      // Only show rounds where deadline hasn't passed everywhere in the world
      // Subtract 12 hours from current time to account for UTC-12 (furthest behind timezone)
      // This keeps rounds visible while it's still that day somewhere on earth
      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() - (12 * 60 * 60 * 1000));

      // Fetch only upcoming rounds for this course
      const filteredRounds = await db.pg
        .select()
        .from(applicationsRoundTable.pg)
        .where(
          and(
            eq(applicationsRoundTable.pg.courseId, courseId),
            or(
              sql`${applicationsRoundTable.pg.applicationDeadline} IS NULL`,
              sql`${applicationsRoundTable.pg.applicationDeadline}::timestamp >= ${deadlineThreshold.toISOString()}::timestamp`,
            ),
          ),
        );

      // Format a single date to "day month" format in UTC (e.g., "17 Nov", "01 Jan")
      // Uses UTC methods to prevent timezone conversion
      const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        return `${day} ${month}`;
      };

      // Format date range based on firstDiscussionDate and numberOfUnits.
      // numberOfUnits is equal to number of days (intensive) or weeks (part-time) in the course.
      // Falls back to lastDiscussionDate when units are missing.
      const formatDateRange = (
        firstDate: string | null,
        lastDate: string | null,
        numberOfUnits: number | null,
        intensity: string | null,
      ) => {
        if (!firstDate) return null;

        const first = new Date(firstDate);

        let computedLast: Date | null = null;

        if (numberOfUnits && numberOfUnits > 0) {
          const isPartTime = intensity?.toLowerCase() === 'part-time';

          let daysToAdd: number;
          if (isPartTime) {
            // Part-time: Add numberOfUnits weeks, then subtract 1 day
            daysToAdd = (numberOfUnits * 7) - 1;
          } else {
            // Intensive: Add (numberOfUnits - 1) days
            daysToAdd = numberOfUnits - 1;
          }

          computedLast = new Date(first.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        } else if (lastDate) {
          computedLast = new Date(lastDate);
        } else {
          return null;
        }

        const firstDay = String(first.getUTCDate()).padStart(2, '0');
        const lastDay = String(computedLast.getUTCDate()).padStart(2, '0');
        const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const lastMonth = computedLast.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

        // Always format as "17 Nov - 21 Nov" or "01 Jan - 05 Dec"
        return `${firstDay} ${firstMonth} - ${lastDay} ${lastMonth}`;
      };

      // Transform rounds with actual date ranges
      const enrichedRounds = filteredRounds.map((round) => {
        return {
          id: round.id,
          intensity: round.intensity,
          applicationDeadline: round.applicationDeadline
            ? formatDate(round.applicationDeadline)
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
      });

      // Sort by start date (earliest first), then by duration (shorter first)
      enrichedRounds.sort((a, b) => {
        if (!a.firstDiscussionDateRaw && !b.firstDiscussionDateRaw) return 0;
        if (!a.firstDiscussionDateRaw) return 1;
        if (!b.firstDiscussionDateRaw) return -1;

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

  getAllUpcomingRounds: publicProcedure
    .query(async () => {
      // Get all active courses
      const allCourses = await db.pg
        .select({
          id: courseTable.pg.id,
          title: courseTable.pg.title,
          slug: courseTable.pg.slug,
        })
        .from(courseTable.pg)
        .where(eq(courseTable.pg.status, 'Active'));

      // Filter out self-paced courses (slug = 'future-of-ai')
      const courses = allCourses.filter(
        (course) => course.slug !== 'future-of-ai',
      );

      // Only show rounds where deadline hasn't passed everywhere in the world
      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() - (12 * 60 * 60 * 1000));

      // Fetch all upcoming rounds for all courses
      const allRounds = await db.pg
        .select()
        .from(applicationsRoundTable.pg)
        .where(
          or(
            sql`${applicationsRoundTable.pg.applicationDeadline} IS NULL`,
            sql`${applicationsRoundTable.pg.applicationDeadline}::timestamp >= ${deadlineThreshold.toISOString()}::timestamp`,
          ),
        );

      // Format a single date to "day month" format in UTC
      const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        return `${day} ${month}`;
      };

      // Format date range with en-dash
      const formatDateRange = (
        firstDate: string | null,
        lastDate: string | null,
        numberOfUnits: number | null,
        intensity: string | null,
      ) => {
        if (!firstDate) return null;

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

        const firstDay = String(first.getUTCDate()).padStart(2, '0');
        const lastDay = String(computedLast.getUTCDate()).padStart(2, '0');
        const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const lastMonth = computedLast.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

        return `${firstDay} ${firstMonth} – ${lastDay} ${lastMonth}`;
      };

      // Create a map of courseId to course info
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      // Enrich rounds with course info and formatting
      const enrichedRounds = allRounds
        .map((round) => {
          if (!round.courseId) return null;
          const course = courseMap.get(round.courseId);
          if (!course) return null;

          return {
            id: round.id,
            courseId: round.courseId,
            courseTitle: course.title,
            courseSlug: course.slug,
            intensity: round.intensity,
            applicationDeadline: round.applicationDeadline
              ? formatDate(round.applicationDeadline)
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
        if (!a.firstDiscussionDateRaw && !b.firstDiscussionDateRaw) return 0;
        if (!a.firstDiscussionDateRaw) return 1;
        if (!b.firstDiscussionDateRaw) return -1;

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
});
