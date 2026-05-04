import { courseRegistrationTable, courseTable, type CourseRegistration } from '@bluedot/db';
import db from './db';

export async function getCertificateData(certificateId: string, existingCourseRegistration?: CourseRegistration) {
  const courseRegistration = existingCourseRegistration ?? await db.get(courseRegistrationTable, { certificateId });
  const course = await db.get(courseTable, { id: courseRegistration.courseId });

  return {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Math.floor(Date.now() / 1000),
    recipientName: courseRegistration.fullName ?? '',
    courseName: course.title,
    courseSlug: course.slug,
    courseDetailsUrl: course.detailsUrl ?? '',
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    certificationDescription: course.certificationDescription || '',
  };
}
