import { z } from 'zod';
import createHttpError from 'http-errors';
import { eq, courseRegistrationTable, courseTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

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

  const courseRegistrations = await db.pg.select()
    .from(courseRegistrationTable.pg)
    .where(eq(courseRegistrationTable.pg.certificateId, certificateId));

  const courseRegistration = courseRegistrations[0];
  if (!courseRegistration) {
    throw new createHttpError.NotFound('Certificate not found');
  }

  const courses = await db.pg.select()
    .from(courseTable.pg)
    .where(eq(courseTable.pg.id, courseRegistration.courseId));

  const course = courses[0];
  if (!course) {
    throw new createHttpError.NotFound('Course not found');
  }

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Date.now() / 1000,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseDetailsUrl: course.detailsUrl,
    certificationDescription: course.certificationDescription || '',
    certificationBadgeImageSrc: course.certificationBadgeImage || '',
  };

  return {
    type: 'success' as const,
    certificate,
  };
});
