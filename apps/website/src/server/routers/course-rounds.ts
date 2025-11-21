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
      // Add 14 hours to current time to account for UTC+14 (furthest ahead timezone)
      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() + (14 * 60 * 60 * 1000));

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

      // Format a single date to "day month" format in UTC (e.g., "17 Nov")
      // Uses UTC methods to prevent timezone conversion
      const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const day = date.getUTCDate();
        const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        return `${day} ${month}`;
      };

      // Format date range from first and last discussion dates in UTC
      // Uses UTC methods to ensure dates aren't shifted by timezone conversion
      const formatDateRange = (firstDate: string | null, lastDate: string | null) => {
        if (!firstDate || !lastDate) return null;

        const first = new Date(firstDate);
        const last = new Date(lastDate);

        const firstDay = first.getUTCDate();
        const lastDay = last.getUTCDate();
        const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const lastMonth = last.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const firstYear = first.getUTCFullYear();
        const lastYear = last.getUTCFullYear();

        // Same month and year: "17 – 21 Nov 2025"
        if (firstMonth === lastMonth && firstYear === lastYear) {
          return `${firstDay} – ${lastDay} ${firstMonth} ${firstYear}`;
        }

        // Different months, same year: "17 Nov – 21 Dec 2025"
        if (firstYear === lastYear) {
          return `${firstDay} ${firstMonth} – ${lastDay} ${lastMonth} ${firstYear}`;
        }

        // Different years: "17 Nov 2025 – 21 Jan 2026"
        return `${firstDay} ${firstMonth} ${firstYear} – ${lastDay} ${lastMonth} ${lastYear}`;
      };

      // Transform rounds with actual date ranges
      const enrichedRounds = filteredRounds.map((round) => {
        return {
          id: round.id,
          courseRoundIntensity: round.courseRoundIntensity || 'Unknown',
          intensity: round.intensity, 
          applicationDeadline: round.applicationDeadline
            ? formatDate(round.applicationDeadline)
            : 'TBD',
          applicationDeadlineRaw: round.applicationDeadline, // Keep raw date for sorting
          dateRange: formatDateRange(round.firstDiscussionDate, round.lastDiscussionDate) || 'TBD',
        };
      });

      // Sort by application deadline (earliest first)
      // Rounds without deadlines ('TBD') are sorted to the end
      enrichedRounds.sort((a, b) => {
        if (!a.applicationDeadlineRaw && !b.applicationDeadlineRaw) return 0;
        if (!a.applicationDeadlineRaw) return 1; // a goes to end
        if (!b.applicationDeadlineRaw) return -1; // b goes to end

        return new Date(a.applicationDeadlineRaw).getTime() - new Date(b.applicationDeadlineRaw).getTime();
      });

      // Group by intensity type
      const grouped = {
        intense: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'intensive'),
        partTime: enrichedRounds.filter((r) => r.intensity?.toLowerCase() === 'part-time'),
      };

      return grouped;
    }),
});
