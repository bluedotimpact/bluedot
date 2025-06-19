import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { courseRegistrationTable, courseTable } from '../../../lib/api/db/tables';

export type Certificate = {
  certificateId: string;
  certificateCreatedAt: number;
  recipientName: string;
  courseName: string;
  certificationDescription: string;
  certificationBadgeImageSrc: string;
  courseDetailsUrl: string;
};

export type GetCertificateResponse = {
  type: 'success';
  certificate: Certificate;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    certificate: z.any(),
  }),
}, async (body, { raw }) => {
  const { certificateId } = raw.req.query;
  if (typeof certificateId !== 'string' || !certificateId) {
    throw new createHttpError.BadRequest('Missing certificateId');
  }

  const courseRegistration = (await db.scan(courseRegistrationTable, {
    filterByFormula: formula(await db.table(courseRegistrationTable), [
      '=',
      { field: 'certificateId' },
      certificateId,
    ]),
  }))[0];
  if (!courseRegistration) {
    throw new createHttpError.NotFound('Certificate not found');
  }

  const course = await db.get(courseTable, courseRegistration.courseId);

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Date.now() / 1000,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseDetailsUrl: course.detailsUrl,
    certificationDescription: course.certificationDescription,
    certificationBadgeImageSrc: course.certificationBadgeImage,
  };

  return {
    type: 'success' as const,
    certificate,
  };
});
