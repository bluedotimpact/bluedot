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
  roundTable,
  type Unit,
  unitTable,
} from '@bluedot/db';
import type { CourseRowData } from '../../components/my-courses/CourseListRow';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { getRescheduleEligibleUnits } from './group-switching';

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
        or(
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
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
    const meetPersonRoundIds = [...new Set(meetPersons.map((mp) => mp.round).filter((r): r is string => !!r))];
    const [units, allGroupsInRounds, allDiscussionsInRounds, courseRoundsForCapacity] = await Promise.all([
      unitIds.length > 0
        ? db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, unitIds)) as Promise<Unit[]>
        : Promise.resolve([] as Unit[]),
      meetPersonRoundIds.length > 0
        ? db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.round, meetPersonRoundIds)) as Promise<Group[]>
        : Promise.resolve([] as Group[]),
      meetPersonRoundIds.length > 0
        ? db.pg.select().from(groupDiscussionTable.pg).where(inArray(groupDiscussionTable.pg.round, meetPersonRoundIds)) as Promise<GroupDiscussion[]>
        : Promise.resolve([] as GroupDiscussion[]),
      meetPersonRoundIds.length > 0
        ? db.pg
          .select({ id: roundTable.pg.id, maxParticipantsPerGroup: roundTable.pg.maxParticipantsPerGroup })
          .from(roundTable.pg)
          .where(inArray(roundTable.pg.id, meetPersonRoundIds))
        : Promise.resolve([] as { id: string; maxParticipantsPerGroup: number | null }[]),
    ]);

    const eligibleUnitsByMeetPersonId = new Map<string, Set<string>>();
    for (const mp of meetPersons) {
      if (!mp.round) continue;
      const groupsInRound = allGroupsInRounds.filter((g) => g.round === mp.round);
      const discussionsInRound = allDiscussionsInRounds.filter((d) => d.round === mp.round);
      const courseRound = courseRoundsForCapacity.find((r) => r.id === mp.round);
      eligibleUnitsByMeetPersonId.set(mp.id, getRescheduleEligibleUnits({
        groups: groupsInRound,
        groupDiscussions: discussionsInRound,
        participantId: mp.id,
        participantHumanOpinion: mp.humanOpinion ?? null,
        maxParticipants: courseRound?.maxParticipantsPerGroup ?? null,
      }));
    }

    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(discussions.map((d) => [d.id, d] as const));
    const roundById = new Map(roundRows.map((r) => [r.id, r] as const));

    const perCourse: CourseRowData[] = courseRegistrations.flatMap((cr) => {
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

      const rescheduleEligibleUnits = meetPerson
        ? Array.from(eligibleUnitsByMeetPersonId.get(meetPerson.id) ?? [])
        : [];

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
        rescheduleEligibleUnits,
        numUnits: meetPerson?.numUnits ?? null,
        uniqueDiscussionAttendance: meetPerson?.uniqueDiscussionAttendance ?? null,
        hasSubmittedActionPlan: (meetPerson?.projectSubmission?.length ?? 0) > 0,
        feedbackFormUrl: meetPerson?.courseFeedbackForm ?? null,
        hasSubmittedFeedback: (meetPerson?.courseFeedback?.length ?? 0) > 0,
      }];
    });

    // Globally soonest upcoming participant discussion across all the user's courses.
    const courseByDiscussionId = new Map<string, { slug: string; title: string }>();
    for (const c of perCourse) {
      for (const d of c.discussions) {
        courseByDiscussionId.set(d.id, { slug: c.course.slug, title: c.course.title });
      }
    }

    // "Next" includes a discussion that's started but not yet ended (i.e. live now).
    const nowSec = Math.floor(Date.now() / 1000);
    const upcomingDiscussions = discussions
      .filter((d) => d.endDateTime > nowSec)
      .sort((a, b) => a.startDateTime - b.startDateTime);
    const soonest = upcomingDiscussions[0];

    let nextDiscussion: {
      courseSlug: string;
      courseTitle: string;
      discussion: GroupDiscussion;
      unit: Unit | null;
      group: Group | null;
    } | null = null;
    if (soonest) {
      const owningCourse = courseByDiscussionId.get(soonest.id);
      if (owningCourse) {
        nextDiscussion = {
          courseSlug: owningCourse.slug,
          courseTitle: owningCourse.title,
          discussion: soonest,
          unit: soonest.courseBuilderUnitRecordId ? unitById.get(soonest.courseBuilderUnitRecordId) ?? null : null,
          group: groups.find((g) => g.id === soonest.group) ?? null,
        };
      }
    }

    return { courses: perCourse, nextDiscussion };
  }),
});
