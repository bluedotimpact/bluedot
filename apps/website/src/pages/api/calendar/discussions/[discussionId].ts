import createHttpError from 'http-errors';
import type { NextApiResponse } from 'next';
import { StreamingResponseSchema } from '@bluedot/ui/src/api';
import {
  courseRegistrationTable,
  groupDiscussionTable,
  meetPersonTable,
  unitTable,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { createDiscussionCalendarIcs } from '../../../../lib/calendar';

function getDiscussionId(queryValue: string | string[] | undefined) {
  if (typeof queryValue === 'string' && queryValue.trim().length > 0) {
    return queryValue;
  }

  throw new createHttpError.BadRequest('Missing discussion id');
}

function getSiteOrigin(host: string | undefined, forwardedProto: string | string[] | undefined) {
  if (!host) {
    return 'https://bluedot.org';
  }

  let protocol = 'https';

  if (typeof forwardedProto === 'string') {
    protocol = forwardedProto.split(',')[0]!.trim();
  } else if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    protocol = 'http';
  }

  return `${protocol}://${host}`;
}

export default makeApiRoute({
  responseBody: StreamingResponseSchema,
}, async (_body, {
  auth,
  raw: { req, res: rawRes },
}) => {
  if (req.method !== 'GET') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  const res = rawRes as unknown as NextApiResponse<string>;
  const discussionId = getDiscussionId(req.query.discussionId);

  const discussion = await db.get(groupDiscussionTable, { id: discussionId });
  if (!discussion) {
    throw new createHttpError.NotFound('Discussion not found');
  }

  const relatedMeetPersonIds = [...new Set([
    ...discussion.participantsExpected,
    ...discussion.facilitators,
  ])];

  const meetPeople = relatedMeetPersonIds.length > 0
    ? await db.scan(meetPersonTable, {
      OR: relatedMeetPersonIds.map((id) => ({ id })),
    })
    : [];

  const courseRegistrationIds = [...new Set(meetPeople
    .map((meetPerson) => meetPerson.applicationsBaseRecordId)
    .filter((id): id is string => Boolean(id)))];

  const courseRegistrations = courseRegistrationIds.length > 0
    ? await db.scan(courseRegistrationTable, {
      OR: courseRegistrationIds.map((id) => ({ id })),
    })
    : [];

  const allowedEmails = new Set([
    ...meetPeople.map((meetPerson) => meetPerson.email).filter((email): email is string => Boolean(email)),
    ...courseRegistrations.map((registration) => registration.email).filter((email): email is string => Boolean(email)),
  ]);

  if (!allowedEmails.has(auth.email)) {
    throw new createHttpError.Forbidden('You do not have access to this discussion');
  }

  const unit = discussion.courseBuilderUnitRecordId
    ? await db.get(unitTable, { id: discussion.courseBuilderUnitRecordId })
    : null;

  const siteOrigin = getSiteOrigin(req.headers.host, req.headers['x-forwarded-proto']);
  const coursePath = unit?.path
    ? new URL(unit.path, siteOrigin).toString()
    : null;

  const { filename, content } = createDiscussionCalendarIcs({
    discussionId: discussion.id,
    courseTitle: unit?.courseTitle,
    coursePath,
    unitNumber: discussion.unitNumber,
    unitTitle: unit?.title,
    unitFallback: discussion.unitFallback,
    startDateTime: discussion.startDateTime,
    endDateTime: discussion.endDateTime,
    zoomLink: discussion.zoomLink,
    activityDoc: discussion.activityDoc,
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(content);

  return null;
});
