import { z } from 'zod';
import createHttpError from 'http-errors';
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
  // TODO: make a reusable method that prevents injection attacks
  if (!certificateId.match(/^[a-zA-Z0-9]+$/)) {
    throw new createHttpError.BadRequest('Invalid certificateId');
  }

  const courseRegistrations = await db.scan(courseRegistrationTable, {
    filterByFormula: `{Certificate ID} = "${certificateId}"`,
  });
  if (courseRegistrations.length === 0) {
    throw new createHttpError.NotFound('Certificate not found');
  }
  const courseRegistration = courseRegistrations[0]!;

  const course = await db.get(courseTable, courseRegistration.courseId);

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseDetailsUrl: course.courseDetailsUrl,
    certificationDescription: course.certificatonDescription,
    certificationBadgeImageSrc: '/images/certificate/generic-certificate-badge.svg', // course.certificationBadgeImage,
  };

  return {
    type: 'success' as const,
    certificate,
  };
});
