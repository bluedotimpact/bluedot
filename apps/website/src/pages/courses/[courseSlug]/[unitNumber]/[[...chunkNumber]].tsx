import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ProgressDots, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { UnitWithContent, getUnitWithContent } from '../../../api/courses/[courseSlug]/[unitNumber]';
import { GetCourseRegistrationResponse } from '../../../api/course-registrations/[courseId]';

type CourseUnitChunkPageProps = UnitWithContent & {
  courseSlug: string;
  unitNumber: string;
};

const CourseUnitChunkPage = ({
  units, unit, chunks, courseSlug, unitNumber,
}: CourseUnitChunkPageProps) => {
  const router = useRouter();
  const {
    query: {
      chunkNumber, chunk: legacyChunkParam,
    },
  } = router;

  // Handle old ?chunk={n-1} format redirect
  useEffect(() => {
    if (typeof legacyChunkParam === 'string') {
      const oldChunkIndex = parseInt(legacyChunkParam, 10);
      if (!Number.isNaN(oldChunkIndex) && oldChunkIndex >= 0) {
        const newChunkNumber = oldChunkIndex + 1;
        router.replace(`/courses/${courseSlug}/${unitNumber}/${newChunkNumber}`);
      }
    }
  }, [courseSlug, unitNumber, legacyChunkParam, router]);

  // Redirect /course/course-name/1 -> /course/course-name/1/1 (to the first chunk)
  useEffect(() => {
    if (!Array.isArray(chunkNumber)) {
      router.replace(`/courses/${courseSlug}/${unitNumber}/1`);
    }
  }, [courseSlug, unitNumber, chunkNumber, router]);

  const auth = useAuthStore((s) => s.auth);

  let actualChunkNumber = '1';
  // [[...chunkNumber]] catch-all syntax results in `chunkNumber` being an array, parse the first element
  if (Array.isArray(chunkNumber) && chunkNumber.length > 0) {
    const [firstChunk] = chunkNumber;
    actualChunkNumber = firstChunk ?? '1';
  }

  // Map 1 -> 0, to avoid ugly urls like /courses/my-course/1/0
  const parsedChunk = Number.parseInt(actualChunkNumber, 10);
  const isInvalidChunk = !Number.isFinite(parsedChunk) || parsedChunk < 1;
  const chunkIndex = isInvalidChunk ? 0 : parsedChunk - 1;

  // Track visits to Unit 1 of Future of AI course
  useEffect(() => {
    if (courseSlug === 'future-of-ai' && unitNumber === '1' && typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'starters',
        course_slug: courseSlug,
      });
    }
  }, [courseSlug, unitNumber]);

  // If we're logged in, ensures a course registration is recorded for this course
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_ignored, fetchCourseRegistration] = useAxios<GetCourseRegistrationResponse>({
    method: 'get',
    url: `/api/course-registrations/${unit.courseId}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  useEffect(() => {
    const shouldRecordCourseRegistration = !!(auth && unit.courseId);
    if (shouldRecordCourseRegistration) {
      fetchCourseRegistration().catch(() => { /* no op, as we ignore errors */ });
    }
  }, [auth, unit.courseId, fetchCourseRegistration]);

  useEffect(() => {
    if (chunks && (chunkIndex < 0 || chunkIndex >= chunks.length)) {
      if (unit.unitNumber !== unitNumber) return; // Handle case where data hasn't updated yet
      router.replace(`/courses/${courseSlug}/${unitNumber}/1`);
    }
  }, [chunkIndex, courseSlug, unitNumber, router]);

  const handleSetChunkIndex = (newIndex: number) => {
    router.push(`/courses/${courseSlug}/${unitNumber}/${newIndex + 1}`);
  };

  if (chunkIndex < 0 || chunkIndex >= chunks.length) {
    return <ProgressDots />;
  }

  const chunk = chunks[chunkIndex];
  const title = `${unit.courseTitle}: Unit ${unitNumber}${chunk?.chunkTitle ? ` | ${chunk.chunkTitle}` : ''}`;
  const metaDescription = chunk?.metaDescription || unit.title;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDescription} />
      </Head>
      <UnitLayout
        chunks={chunks}
        unit={unit}
        units={units}
        unitNumber={unitNumber}
        chunkIndex={chunkIndex}
        setChunkIndex={handleSetChunkIndex}
        courseSlug={courseSlug}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<CourseUnitChunkPageProps> = async ({ params }) => {
  const { courseSlug, unitNumber } = params ?? {};

  if (typeof courseSlug !== 'string') {
    throw new Error('Invalid course slug');
  }
  if (typeof unitNumber !== 'string') {
    throw new Error('Invalid unit number');
  }

  const unitWithContent = await getUnitWithContent(courseSlug, unitNumber);

  return {
    props: {
      ...unitWithContent,
      courseSlug,
      unitNumber,
    },
  };
};

CourseUnitChunkPage.hideFooter = true;

export default CourseUnitChunkPage;
