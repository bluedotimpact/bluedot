import type { NextApiRequest, NextApiResponse } from 'next';
import createHttpError from 'http-errors';
// eslint-disable-next-line import/no-extraneous-dependencies
import AirtableError from 'airtable/lib/airtable_error';
import db, {
  Cohort,
  cohortClassTable, cohortTable, personTable, zoomAccountTable,
} from '../../../lib/api/db';
import { apiRoute } from '../../../lib/api/apiRoute';
import { parseZoomLink } from '../../../lib/zoomLinkParser';

export type MeetingParticipantsRequest = {
  cohortId: string,
};

export type MeetingParticipantsResponse = {
  type: 'success',
  cohortClassId: string,
  participants: {
    id: string,
    name: string,
    role: 'host' | 'participant',
  }[],
  meetingNumber: string,
  meetingPassword: string,
  meetingHostKey: string,
} | {
  type: 'redirect',
  to: string,
} | {
  type: 'error',
  message: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<MeetingParticipantsResponse>,
) => {
  let cohort: Cohort;
  try {
    cohort = await db.get(cohortTable, req.body.cohortId);
  } catch (err) {
    if (err instanceof AirtableError && err.statusCode === 404) {
      throw new createHttpError.NotFound(`Cohort ${req.body.cohortId} not found`);
    }
    throw err;
  }
  const cohortClasses = await Promise.all(
    cohort.cohortSessions
      .map((cohortClassId) => db.get(cohortClassTable, cohortClassId)),
  );
  const cohortClassesWithDistance = cohortClasses.map((cohortClass) => ({
    cohortClass,
    distance: Math.abs((Date.now() / 1000) - cohortClass['Start date/time']!),
  }));
  if (cohortClassesWithDistance.length === 0) {
    res.status(404).json({
      type: 'error',
      message: 'No cohort classes found for this cohort.',
    });
    return;
  }

  let nearestCohortClassWithDistance = cohortClassesWithDistance[0]!;
  cohortClassesWithDistance.forEach((cohortClassWithDistance) => {
    if (cohortClassWithDistance.distance < nearestCohortClassWithDistance.distance) {
      nearestCohortClassWithDistance = cohortClassWithDistance;
    }
  });
  const { cohortClass } = nearestCohortClassWithDistance;

  if (!cohortClass['Zoom account']) {
    throw new createHttpError.InternalServerError(`Cohort class ${cohortClass.id} missing Zoom account`);
  }
  const zoomAccount = await db.get(zoomAccountTable, cohortClass['Zoom account']);
  const facilitators = await Promise.all(cohortClass.Facilitators.map((facilitatorId) => db.get(personTable, facilitatorId)));
  const participants = await Promise.all(
    cohortClass['Participants (Expected)']
      .map((participantId) => db.get(personTable, participantId)),
  );
  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount['Meeting link']);
  const meetingHostKey = zoomAccount['Host key'];

  res.status(200).json({
    type: 'success',
    cohortClassId: cohortClass.id,
    participants: [
      ...facilitators.map((facilitator) => ({ id: facilitator.id, name: facilitator.name, role: 'host' as const })),
      ...participants.map((participant) => ({ id: participant.id, name: participant.name, role: 'participant' as const })),
    // eslint-disable-next-line no-nested-ternary
    ].sort((a, b) => ((a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)),
    meetingNumber,
    meetingPassword,
    meetingHostKey,
  });
}, 'insecure_no_auth');

export const maxDuration = 60;
