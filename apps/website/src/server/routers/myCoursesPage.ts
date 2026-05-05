import {
  and,
  applicationsRoundTable,
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

    // Exclude facilitator-role registrations; the facilitator view lives elsewhere (P3).
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
    const allExpectedDiscussionIds = [...new Set(meetPersons.flatMap((mp) => mp.expectedDiscussionsParticipant ?? []))];
    const upcomingRoundIds = [...new Set(courseRegistrations
      .filter((cr) => cr.roundStatus === 'Future')
      .map((cr) => cr.roundId)
      .filter((id): id is string => !!id))];

    const [facilitators, discussions, roundStartRows] = await Promise.all([
      facilitatorIds.length > 0
        ? db.pg
          .select({
            id: meetPersonTable.pg.id,
            firstName: meetPersonTable.pg.firstName,
            lastName: meetPersonTable.pg.lastName,
          })
          .from(meetPersonTable.pg)
          .where(inArray(meetPersonTable.pg.id, facilitatorIds))
        : Promise.resolve([]),
      allExpectedDiscussionIds.length > 0
        ? db.pg
          .select()
          .from(groupDiscussionTable.pg)
          .where(inArray(groupDiscussionTable.pg.id, allExpectedDiscussionIds))
        : Promise.resolve([] as GroupDiscussion[]),
      upcomingRoundIds.length > 0
        ? db.pg
          .select({
            id: applicationsRoundTable.pg.id,
            firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
          })
          .from(applicationsRoundTable.pg)
          .where(inArray(applicationsRoundTable.pg.id, upcomingRoundIds))
        : Promise.resolve([]),
    ]);

    const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter((id): id is string => !!id))];
    const units: Unit[] = unitIds.length > 0
      ? await db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, unitIds))
      : [];

    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(discussions.map((d) => [d.id, d] as const));
    const roundStartById = new Map(roundStartRows.map((r) => [r.id, r.firstDiscussionDate] as const));

    const perCourse = courseRegistrations.flatMap((cr) => {
      const course = courses.find((c) => c.id === cr.courseId);
      if (!course) return [];

      const meetPerson = meetPersons.find((mp) => mp.applicationsBaseRecordId === cr.id);
      const groupId = meetPerson?.groupsAsParticipant?.[0];
      const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
      const facilitatorNames = (group?.facilitator ?? [])
        .flatMap((id) => {
          const f = facilitatorById.get(id);
          if (!f) return [];
          const full = `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim();
          return full ? [full] : [];
        });

      const expectedIds = meetPerson?.expectedDiscussionsParticipant ?? [];
      const courseDiscussions = expectedIds
        .map((id) => discussionById.get(id))
        .filter((d): d is GroupDiscussion => !!d)
        .sort((a, b) => a.startDateTime - b.startDateTime);

      const courseUnits: Record<string, Unit> = {};
      for (const d of courseDiscussions) {
        const unit = d.courseBuilderUnitRecordId ? unitById.get(d.courseBuilderUnitRecordId) : undefined;
        if (unit) courseUnits[d.id] = unit;
      }

      // slackChannelId and activityDoc live on group_discussion. They're shared across
      // a group's discussions, so any non-empty value works as the course-level link.
      const slackChannelId = courseDiscussions.find((d) => d.slackChannelId)?.slackChannelId ?? null;
      const activityDoc = courseDiscussions.find((d) => d.activityDoc)?.activityDoc ?? null;

      return [{
        courseRegistration: cr,
        course,
        group,
        facilitatorNames,
        meetPersonId: meetPerson?.id ?? null,
        roundId: meetPerson?.round ?? cr.roundId ?? null,
        discussions: courseDiscussions,
        attendedDiscussionIds: meetPerson?.attendedDiscussions ?? [],
        units: courseUnits,
        slackChannelId,
        activityDoc,
        roundStartDate: cr.roundId ? roundStartById.get(cr.roundId) ?? null : null,
      }];
    });

    // Globally soonest upcoming participant discussion across all the user's courses.
    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIdsByCourseSlug = new Map<string, Set<string>>();
    for (const c of perCourse) {
      expectedIdsByCourseSlug.set(c.course.slug, new Set(c.discussions.map((d) => d.id)));
    }

    const upcomingDiscussions = discussions
      .filter((d) => d.startDateTime > nowSec)
      .sort((a, b) => a.startDateTime - b.startDateTime);
    const soonest = upcomingDiscussions[0];

    let nextDiscussion: {
      courseSlug: string;
      discussion: GroupDiscussion;
      unit: Unit | null;
      group: Group | null;
    } | null = null;
    if (soonest) {
      const owningSlug = [...expectedIdsByCourseSlug.entries()]
        .find(([, ids]) => ids.has(soonest.id))?.[0];
      if (owningSlug) {
        nextDiscussion = {
          courseSlug: owningSlug,
          discussion: soonest,
          unit: soonest.courseBuilderUnitRecordId ? unitById.get(soonest.courseBuilderUnitRecordId) ?? null : null,
          group: groups.find((g) => g.id === soonest.group) ?? null,
        };
      }
    }

    return { courses: perCourse, nextDiscussion };
  }),
});
