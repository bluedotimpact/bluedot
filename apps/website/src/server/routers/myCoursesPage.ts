import {
  and,
  courseRegistrationTable,
  courseTable,
  eq,
  type Group,
  type GroupDiscussion,
  groupDiscussionTable,
  groupTable,
  inArray,
  meetPersonTable,
  ne,
  or,
  type Unit,
  unitTable,
} from '@bluedot/db';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const myCoursesPageRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const { email } = ctx.auth;

    // Course registrations the user has — exclude facilitator role; that view lives elsewhere.
    const courseRegistrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        or(ne(courseRegistrationTable.pg.role, 'Facilitator'), eq(courseRegistrationTable.pg.role, '')),
      ));

    if (courseRegistrations.length === 0) {
      return { courses: [], nextDiscussion: null };
    }

    const courseIds = [...new Set(courseRegistrations.map((cr) => cr.courseId).filter((id): id is string => !!id))];

    const [courses, meetPersons] = await Promise.all([
      courseIds.length > 0
        ? db.pg.select().from(courseTable.pg).where(inArray(courseTable.pg.id, courseIds))
        : Promise.resolve([]),
      db.pg.select().from(meetPersonTable.pg).where(eq(meetPersonTable.pg.email, email)),
    ]);

    const groupIds = [...new Set(meetPersons.flatMap((mp) => mp.groupsAsParticipant ?? []))];
    const groups: Group[] = groupIds.length > 0
      ? await db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.id, groupIds))
      : [];

    const facilitatorIds = [...new Set(groups.flatMap((g) => g.facilitator ?? []))];
    const facilitators = facilitatorIds.length > 0
      ? await db.pg
        .select({
          id: meetPersonTable.pg.id,
          firstName: meetPersonTable.pg.firstName,
          lastName: meetPersonTable.pg.lastName,
        })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, facilitatorIds))
      : [];
    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));

    const perCourse = courseRegistrations.flatMap((cr) => {
      const course = courses.find((c) => c.id === cr.courseId);
      if (!course) return [];

      const meetPerson = meetPersons.find((mp) => mp.applicationsBaseRecordId === cr.id);
      const groupId = meetPerson?.groupsAsParticipant?.[0];
      const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
      const facilitatorNames = (group?.facilitator ?? [])
        .map((id) => facilitatorById.get(id))
        .map((f) => (f ? `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim() : ''))
        .filter((s) => s.length > 0);

      return [{
        courseRegistration: cr,
        course,
        group,
        facilitatorNames,
        // Internal: used to derive the global next-discussion below; stripped before return.
        expectedDiscussionsParticipant: meetPerson?.expectedDiscussionsParticipant ?? [],
      }];
    });

    // Globally soonest upcoming discussion across all the user's expected discussions.
    const allExpectedDiscussionIds = [...new Set(perCourse.flatMap((c) => c.expectedDiscussionsParticipant))];

    let nextDiscussion: {
      courseSlug: string;
      discussion: GroupDiscussion;
      unit: Unit | null;
      group: Group | null;
    } | null = null;

    if (allExpectedDiscussionIds.length > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const discussions = await db.pg
        .select()
        .from(groupDiscussionTable.pg)
        .where(inArray(groupDiscussionTable.pg.id, allExpectedDiscussionIds));

      const upcoming = discussions
        .filter((d) => d.startDateTime > nowSec)
        .sort((a, b) => a.startDateTime - b.startDateTime);
      const soonest = upcoming[0];

      if (soonest) {
        const owningCourse = perCourse.find((c) => c.expectedDiscussionsParticipant.includes(soonest.id));
        const unit = soonest.courseBuilderUnitRecordId
          ? (await db.pg
            .select()
            .from(unitTable.pg)
            .where(eq(unitTable.pg.id, soonest.courseBuilderUnitRecordId))
            .limit(1))[0] ?? null
          : null;
        const group = groups.find((g) => g.id === soonest.group) ?? null;
        if (owningCourse) {
          nextDiscussion = {
            courseSlug: owningCourse.course.slug,
            discussion: soonest,
            unit,
            group,
          };
        }
      }
    }

    return {
      courses: perCourse.map(({ expectedDiscussionsParticipant: _, ...rest }) => rest),
      nextDiscussion,
    };
  }),
});
