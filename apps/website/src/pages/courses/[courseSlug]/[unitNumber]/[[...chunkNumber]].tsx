import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../../api/courses/[courseSlug]/[unitNumber]';
import { GetGroupDiscussionResponse } from '../../../api/courses/[courseSlug]/[unitNumber]/groupDiscussion';
import { trpc } from '../../../../utils/trpc';

const CourseUnitChunkPage = () => {
  const router = useRouter();
  const {
    query: {
      courseSlug, unitNumber, chunkNumber, chunk: legacyChunkParam,
    },
  } = router;

  // Handle old ?chunk={n-1} format redirect
  useEffect(() => {
    if (typeof courseSlug === 'string' && typeof unitNumber === 'string' && typeof legacyChunkParam === 'string') {
      const oldChunkIndex = parseInt(legacyChunkParam, 10);
      if (!Number.isNaN(oldChunkIndex) && oldChunkIndex >= 0) {
        const newChunkNumber = oldChunkIndex + 1;
        router.replace(`/courses/${courseSlug}/${unitNumber}/${newChunkNumber}`);
      }
    }
  }, [courseSlug, unitNumber, legacyChunkParam, router]);

  // Redirect /course/course-name/1 -> /course/course-name/1/1 (to the first chunk)
  useEffect(() => {
    if (typeof courseSlug === 'string' && typeof unitNumber === 'string' && !Array.isArray(chunkNumber)) {
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

  const [{ data, loading, error }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}`,
  });

  const [{ data: groupDiscussionData, loading: groupDiscussionLoading, error: groupDiscussionError }] = useAxios<GetGroupDiscussionResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}/groupDiscussion`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, {
    manual: !auth,
  });

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
  const { refetch: fetchCourseRegistration } = trpc.courseRegistrations.getById.useQuery(data?.unit.courseId ?? '', { enabled: false });

  useEffect(() => {
    const shouldRecordCourseRegistration = !!(auth && data?.unit.courseId);
    if (shouldRecordCourseRegistration) {
      fetchCourseRegistration().catch(() => { /* no op, as we ignore errors */ });
    }
  }, [auth, data?.unit.courseId]);

  useEffect(() => {
    if (data && data.chunks && (chunkIndex < 0 || chunkIndex >= data.chunks.length)) {
      if (data.unit.unitNumber !== unitNumber) return; // Handle case where data hasn't updated yet
      router.replace(`/courses/${courseSlug}/${unitNumber}/1`);
    }
  }, [data, chunkIndex, courseSlug, unitNumber, router]);

  const handleSetChunkIndex = (newIndex: number) => {
    router.push(`/courses/${courseSlug}/${unitNumber}/${newIndex + 1}`);
  };

  if (typeof unitNumber !== 'string') {
    return <ProgressDots />;
  }

  if (loading || groupDiscussionLoading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  if (chunkIndex < 0 || chunkIndex >= data.chunks.length) {
    return <ProgressDots />;
  }

  return (
    <UnitLayout
      chunks={data.chunks}
      unit={data.unit}
      units={data.units}
      unitNumber={parseInt(unitNumber)}
      chunkIndex={chunkIndex}
      setChunkIndex={handleSetChunkIndex}
      groupDiscussionWithZoomInfo={groupDiscussionData}
      groupDiscussionError={groupDiscussionError}
    />
  );
};

CourseUnitChunkPage.hideFooter = true;

export default CourseUnitChunkPage;
