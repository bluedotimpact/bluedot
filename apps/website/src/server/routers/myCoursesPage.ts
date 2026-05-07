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
  isNull,
  meetPersonTable,
  ne,
  or,
  type Unit,
  unitTable,
} from '@bluedot/db';
import type { CourseListRowProps } from '../../components/my-courses/CourseListRow';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const myCoursesPageRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const { email } = ctx.auth;

    const courseRegistrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        or(
          ne(courseRegistrationTable.pg.role, 'Facilitator'),
          eq(courseRegistrationTable.pg.role, ''),
          isNull(courseRegistrationTable.pg.role),
        ),
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
    const allRoundIds = [...new Set(courseRegistrations.map((cr) => cr.roundId).filter((id): id is string => !!id))];

    const [facilitators, discussions, roundRows] = await Promise.all([
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
      allRoundIds.length > 0
        ? db.pg
          .select({
            id: applicationsRoundTable.pg.id,
            firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
            lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
          })
          .from(applicationsRoundTable.pg)
          .where(inArray(applicationsRoundTable.pg.id, allRoundIds))
        : Promise.resolve([]),
    ]);

    const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter((id): id is string => !!id))];
    const units: Unit[] = unitIds.length > 0
      ? await db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, unitIds))
      : [];

    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(discussions.map((d) => [d.id, d] as const));
    const roundById = new Map(roundRows.map((r) => [r.id, r] as const));

    const perCourse: CourseListRowProps[] = courseRegistrations.flatMap((cr) => {
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
        roundStartDate: cr.roundId ? roundById.get(cr.roundId)?.firstDiscussionDate ?? null : null,
        roundEndDate: cr.roundId ? roundById.get(cr.roundId)?.lastDiscussionDate ?? null : null,
        numUnits: meetPerson?.numUnits ?? null,
        uniqueDiscussionAttendance: meetPerson?.uniqueDiscussionAttendance ?? null,
        hasSubmittedActionPlan: (meetPerson?.projectSubmission?.length ?? 0) > 0,
        feedbackFormUrl: meetPerson?.courseFeedbackForm ?? null,
        hasSubmittedFeedback: (meetPerson?.courseFeedback?.length ?? 0) > 0,
      }];
    });

    // Globally soonest upcoming participant discussion across all the user's courses.
    const nowSec = Math.floor(Date.now() / 1000);
    const courseSlugByDiscussionId = new Map<string, string>();
    for (const c of perCourse) {
      for (const d of c.discussions) {
        courseSlugByDiscussionId.set(d.id, c.course.slug);
      }
    }

    // "Next" includes a discussion that's started but not yet ended (i.e. live now).
    const upcomingDiscussions = discussions
      .filter((d) => d.endDateTime > nowSec)
      .sort((a, b) => a.startDateTime - b.startDateTime);
    const soonest = upcomingDiscussions[0];

    let nextDiscussion: {
      courseSlug: string;
      discussion: GroupDiscussion;
      unit: Unit | null;
      group: Group | null;
    } | null = null;
    if (soonest) {
      const owningSlug = courseSlugByDiscussionId.get(soonest.id);
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
