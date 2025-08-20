import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import UnitLayout from '../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../api/courses/[courseSlug]/[unitNumber]';
import { GetGroupDiscussionResponse } from '../../api/courses/[courseSlug]/[unitNumber]/groupDiscussion';
import { GetCourseRegistrationResponse } from '../../api/course-registrations/[courseId]';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitNumber } } = useRouter();

  if (typeof unitNumber !== 'string') {
    return <ProgressDots />;
  }

  const auth = useAuthStore((s) => s.auth);

  const [{ data, loading, error }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}`,
  });

  // Fetch for group discussions (requires auth)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_ignored, fetchCourseRegistration] = useAxios<GetCourseRegistrationResponse>({
    method: 'get',
    url: `/api/course-registrations/${data?.unit.courseId}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });
  useEffect(() => {
    const shouldRecordCourseRegistration = !!(auth && data?.unit.courseId);
    if (shouldRecordCourseRegistration) {
      fetchCourseRegistration().catch(() => { /* no op, as we ignore errors */ });
    }
  }, [auth, data?.unit.courseId]);

  if (loading || groupDiscussionLoading) {
    return <ProgressDots />;
  }

  if (error || groupDiscussionError || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  return (
    <UnitLayout
      chunks={data.chunks}
      unit={data.unit}
      units={data.units}
      unitNumber={parseInt(unitNumber)}
      groupDiscussion={groupDiscussionData?.groupDiscussion || null}
    />
  );
};

CourseUnitPage.hideFooter = true;

export default CourseUnitPage;
