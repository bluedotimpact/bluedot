import { z } from 'zod';
import createHttpError from 'http-errors';
import { courseRegistrationTable, courseTable } from '@bluedot/db';
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

export async function getCertificateData(certificateId: string): Promise<Certificate> {
  const courseRegistration = await db.get(courseRegistrationTable, { certificateId });
  const course = await db.get(courseTable, { id: courseRegistration.courseId });

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Date.now() / 1000,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseDetailsUrl: course.detailsUrl,
    certificationDescription: course.certificationDescription || '',
    certificationBadgeImageSrc: course.certificationBadgeImage || '',
  };

  return certificate;
}

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

  const certificate = await getCertificateData(certificateId);

  return {
    type: 'success' as const,
    certificate,
  };
});
