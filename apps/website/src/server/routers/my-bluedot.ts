import {
  and,
  applicationsRoundTable,
  arrayOverlaps,
  courseRegistrationTable,
  courseTable,
  dropoutTable,
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
import type { FacilitatorRowProps, ParticipantRowProps } from '../../components/my-courses/CourseListRow';
import db from '../../lib/api/db';
import { parseWeekFromRoundName } from '../../lib/utils';
import { protectedProcedure, router } from '../trpc';
import { getAvailableGroupsAndDiscussions } from './group-switching';

const fetchActiveCoursesByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return db.pg.select().from(courseTable.pg).where(and(
    inArray(courseTable.pg.id, ids),
    eq(courseTable.pg.status, 'Active'),
  ));
};

const fetchApplicationsRoundsByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  return db.pg
    .select({
      id: applicationsRoundTable.pg.id,
      firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
      lastDiscussionDate: applicationsRoundTable.pg.lastDiscussionDate,
      intensity: applicationsRoundTable.pg.intensity,
    })
    .from(applicationsRoundTable.pg)
    .where(inArray(applicationsRoundTable.pg.id, ids));
};

const fetchUnitsByIds = async (ids: string[]): Promise<Unit[]> => {
  if (ids.length === 0) return [];
  return db.pg.select().from(unitTable.pg).where(inArray(unitTable.pg.id, ids)) as Promise<Unit[]>;
};

const fetchDropoutStatusByRegId = async (regIds: string[]): Promise<Map<string, { isDroppedOut: boolean; isDeferred: boolean }>> => {
  const status = new Map<string, { isDroppedOut: boolean; isDeferred: boolean }>();
  if (regIds.length === 0) return status;
  const dropouts = await db.pg
    .select({ applicantId: dropoutTable.pg.applicantId, type: dropoutTable.pg.type })
    .from(dropoutTable.pg)
    .where(arrayOverlaps(dropoutTable.pg.applicantId, regIds));
  for (const d of dropouts) {
    for (const regId of d.applicantId ?? []) {
      if (!regIds.includes(regId)) continue;
      const cur = status.get(regId) ?? { isDroppedOut: false, isDeferred: false };
      if (d.type === 'Deferral') {
        cur.isDeferred = true;
        cur.isDroppedOut = false;
      } else if (!cur.isDeferred) {
        cur.isDroppedOut = true;
      }

      status.set(regId, cur);
    }
  }

  return status;
};

const unique = <T>(values: (T | null | undefined)[]): T[] =>
  [...new Set(values.filter((v): v is T => v != null))];

export const myBluedotRouter = router({
  hasFacilitatorRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.pg
      .select({ id: courseRegistrationTable.pg.id })
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, ctx.auth.email),
        eq(courseRegistrationTable.pg.role, 'Facilitator'),
        or(
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
        ),
      ))
      .limit(1);
    return { hasFacilitatorRegistrations: rows.length > 0 };
  }),

  myCoursesPage: protectedProcedure.query(async ({ ctx }) => {
    const { email } = ctx.auth;

    // Step 1: Fetch data
    const courseRegistrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        or(
          // Happy path: role === 'Participant'
          ne(courseRegistrationTable.pg.role, 'Facilitator'),
          isNull(courseRegistrationTable.pg.role),
        ),
        or(
          // Happy path: decision === 'Accept'
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
        ),
      ));

    if (courseRegistrations.length === 0) {
      return { courses: [], nextDiscussion: null };
    }

    const [courses, meetPersons, dropoutStatusByRegId] = await Promise.all([
      fetchActiveCoursesByIds(unique(courseRegistrations.map((cr) => cr.courseId))),
      db.pg.select().from(meetPersonTable.pg).where(eq(meetPersonTable.pg.email, email)),
      fetchDropoutStatusByRegId(courseRegistrations.map((cr) => cr.id)),
    ]);

    // The user's own groups (needs meetPersons.groupsAsParticipant).
    const groupIds = unique(meetPersons.flatMap((mp) => mp.groupsAsParticipant ?? []));
    const groups: Group[] = groupIds.length > 0
      ? await db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.id, groupIds))
      : [];

    // Facilitators (from groups), discussions (from meetPersons), rounds (from regs).
    const facilitatorIds = unique(groups.flatMap((g) => g.facilitator ?? []));
    const allExpectedDiscussionIds = unique(meetPersons.flatMap((mp) => mp.expectedDiscussionsParticipant ?? []));
    const allRoundIds = unique(courseRegistrations.map((cr) => cr.roundId));

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
      fetchApplicationsRoundsByIds(allRoundIds),
    ]);

    // Units (from discussions) + round-wide groups/discussions/courseRounds (for reschedule eligibility — see Step 3).
    const meetPersonRoundIds = unique(meetPersons.map((mp) => mp.round));
    const [units, allGroupsInRounds, allDiscussionsInRounds, courseRoundsForCapacity] = await Promise.all([
      fetchUnitsByIds(unique(discussions.map((d) => d.courseBuilderUnitRecordId))),
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

    // Step 2: Calculate synthetic results for main section
    // 2a: Calculate units eligible for rescheduling
    const unitsEligibleToRescheduleByMeetPersonId = new Map<string, Set<string>>();
    for (const mp of meetPersons) {
      if (!mp.round) continue;
      const allGroupsInRound = allGroupsInRounds.filter((g) => g.round === mp.round);
      const allGroupDiscussionsInRound = allDiscussionsInRounds.filter((d) => d.round === mp.round);
      const courseRound = courseRoundsForCapacity.find((r) => r.id === mp.round);
      const { rescheduleEligibleUnits } = getAvailableGroupsAndDiscussions({
        allGroupsInRound,
        allGroupDiscussionsInRound,
        participantId: mp.id,
        participantHumanOpinion: mp.humanOpinion ?? null,
        maxParticipants: courseRound?.maxParticipantsPerGroup ?? null,
      });
      unitsEligibleToRescheduleByMeetPersonId.set(mp.id, new Set(rescheduleEligibleUnits));
    }

    // 2b: Build one row per course registration.
    const facilitatorById = new Map(facilitators.map((f) => [f.id, f]));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(discussions.map((d) => [d.id, d] as const));
    const roundById = new Map(roundRows.map((r) => [r.id, r] as const));

    const perCourse: ParticipantRowProps[] = courseRegistrations.flatMap((cr): ParticipantRowProps[] => {
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
        ? Array.from(unitsEligibleToRescheduleByMeetPersonId.get(meetPerson.id) ?? [])
        : [];
      const status = dropoutStatusByRegId.get(cr.id) ?? { isDroppedOut: false, isDeferred: false };

      return [{
        mode: 'participant',
        courseRegistration: cr,
        course,
        group,
        facilitatorNames,
        meetPersonId: meetPerson?.id ?? null,
        groupsAsParticipant: meetPerson?.groupsAsParticipant ?? null,
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
        isDroppedOut: status.isDroppedOut,
        isDeferred: status.isDeferred,
      }];
    });

    // Step 3: Calculate results for NextDiscussionCard section
    const courseByDiscussionId = new Map<string, { slug: string; title: string }>();
    for (const c of perCourse) {
      // Skip dropped-out registrations (but keep deferred — they still have a future track).
      if (c.isDroppedOut && !c.isDeferred) continue;
      for (const d of c.discussions) {
        courseByDiscussionId.set(d.id, { slug: c.course.slug, title: c.course.title });
      }
    }

    // "Next" includes a discussion that's started but not yet ended (i.e. live now)
    const nowSec = Math.floor(Date.now() / 1000);
    const soonest = discussions
      .filter((d) => d.endDateTime > nowSec)
      .sort((a, b) => a.startDateTime - b.startDateTime)
      .find((d) => courseByDiscussionId.has(d.id));

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

  facilitatedCoursesPage: protectedProcedure.query(async ({ ctx }) => {
    const { email } = ctx.auth;

    // Step 1: Fetch data
    const courseRegistrations = await db.pg
      .select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, email),
        eq(courseRegistrationTable.pg.role, 'Facilitator'),
        or(
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
        ),
      ));

    if (courseRegistrations.length === 0) {
      return { courses: [] as FacilitatorRowProps[], nextDiscussions: [] };
    }

    const [courses, meetPersons] = await Promise.all([
      fetchActiveCoursesByIds(unique(courseRegistrations.map((cr) => cr.courseId))),
      db.pg.select().from(meetPersonTable.pg).where(eq(meetPersonTable.pg.email, email)),
    ]);

    // Groups + discussions (from meetPersons), rounds (from regs).
    const meetPersonRoundIds = unique(meetPersons.map((mp) => mp.round));
    const expectedDiscussionIds = unique(meetPersons.flatMap((mp) => mp.expectedDiscussionsFacilitator ?? []));

    const [allGroupsInRounds, allExpectedDiscussions, roundRows] = await Promise.all([
      meetPersonRoundIds.length > 0
        ? db.pg.select().from(groupTable.pg).where(inArray(groupTable.pg.round, meetPersonRoundIds)) as Promise<Group[]>
        : Promise.resolve([] as Group[]),
      expectedDiscussionIds.length > 0
        ? db.pg.select().from(groupDiscussionTable.pg).where(inArray(groupDiscussionTable.pg.id, expectedDiscussionIds)) as Promise<GroupDiscussion[]>
        : Promise.resolve([] as GroupDiscussion[]),
      fetchApplicationsRoundsByIds(unique(courseRegistrations.map((cr) => cr.roundId))),
    ]);

    // Units (from discussions).
    const units = await fetchUnitsByIds(unique(allExpectedDiscussions.map((d) => d.courseBuilderUnitRecordId)));

    // Step 2: Build one row per (registration × facilitated group)
    const meetPersonIds = new Set(meetPersons.map((mp) => mp.id));
    const facilitatedGroups = allGroupsInRounds.filter((g) => (g.facilitator ?? []).some((id) => meetPersonIds.has(id)));

    const roundById = new Map(roundRows.map((r) => [r.id, r] as const));
    const unitById = new Map(units.map((u) => [u.id, u] as const));
    const discussionById = new Map(allExpectedDiscussions.map((d) => [d.id, d] as const));

    const perRow: FacilitatorRowProps[] = courseRegistrations.flatMap((cr): FacilitatorRowProps[] => {
      const course = courses.find((c) => c.id === cr.courseId);
      if (!course) return [];
      const meetPerson = meetPersons.find((mp) => mp.applicationsBaseRecordId === cr.id);
      const round = cr.roundId ? roundById.get(cr.roundId) : null;
      const baseRow = {
        mode: 'facilitator' as const,
        courseRegistration: cr,
        course,
        meetPersonId: meetPerson?.id ?? null,
        roundId: meetPerson?.round ?? cr.roundId ?? null,
        roundStartDate: round?.firstDiscussionDate ?? null,
        roundEndDate: round?.lastDiscussionDate ?? null,
        roundIntensity: round?.intensity ?? null,
        hasSubmittedFeedback: (meetPerson?.courseFeedback?.length ?? 0) > 0,
        isDroppedOut: false,
        isDeferred: false,
      };

      const emptyRow: FacilitatorRowProps = {
        ...baseRow, group: null, discussions: [], attendedDiscussionIds: [], units: {},
      };

      // meetPerson rows aren't created until a Future application is processed. Surface accepted/in-review
      // Future regs as pending rows so the user sees them in the Upcoming tab.
      if (!meetPerson) {
        if (cr.roundStatus !== 'Future' || cr.decision === 'Reject') return [];
        return [emptyRow];
      }

      const groupsForCr = facilitatedGroups.filter((g) => g.round === meetPerson.round && (g.facilitator ?? []).includes(meetPerson.id));

      if (groupsForCr.length === 0) {
        return [emptyRow];
      }

      return groupsForCr.map((group): FacilitatorRowProps => {
        const groupDiscussions = (meetPerson.expectedDiscussionsFacilitator ?? [])
          .map((id) => discussionById.get(id))
          .filter((d): d is GroupDiscussion => !!d && d.group === group.id)
          .sort((a, b) => a.startDateTime - b.startDateTime);

        const courseUnits: Record<string, Unit> = {};
        for (const d of groupDiscussions) {
          const unit = d.courseBuilderUnitRecordId ? unitById.get(d.courseBuilderUnitRecordId) : undefined;
          if (unit) courseUnits[d.id] = unit;
        }

        return {
          ...baseRow,
          group,
          discussions: groupDiscussions,
          attendedDiscussionIds: meetPerson.attendedDiscussions ?? [],
          units: courseUnits,
        };
      });
    });

    // Step 3: Calculate results for NextDiscussionCard section
    const nowSec = Math.floor(Date.now() / 1000);
    const nextDiscussions = perRow
      .flatMap((row) => {
        if (!row.group) return [];
        const soonest = row.discussions.find((d) => d.endDateTime > nowSec);
        if (!soonest) return [];

        const unit = soonest.courseBuilderUnitRecordId ? unitById.get(soonest.courseBuilderUnitRecordId) ?? null : null;
        const week = parseWeekFromRoundName(row.courseRegistration.roundName);
        const groupPart = row.group.groupNumber != null ? `Group ${row.group.groupNumber}` : row.group.groupName;
        const facilitatorSubtitle = [
          week !== null ? `Week ${week}` : null,
          row.roundIntensity,
          groupPart,
        ].filter(Boolean).join(' ');

        return [{
          courseSlug: row.course.slug,
          courseTitle: row.course.title,
          discussion: soonest,
          unit,
          group: row.group,
          facilitatorSubtitle,
        }];
      })
      .sort((a, b) => a.discussion.startDateTime - b.discussion.startDateTime);

    return { courses: perRow, nextDiscussions };
  }),
});
