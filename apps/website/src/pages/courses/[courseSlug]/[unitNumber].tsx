import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import axios from 'axios';
import UnitLayout from '../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../api/courses/[courseSlug]/[unitNumber]';
import { GetCourseRegistrationResponse } from '../../api/course-registrations/[courseId]';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitNumber, chunk } } = useRouter();
  const auth = useAuthStore((s) => s.auth);

  if (typeof unitNumber !== 'string') {
    return <ProgressDots />;
  }

  const [{ data, loading, error }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}`,
  });

  // Update progress when page loads and we have auth + unit data
  useEffect(() => {
    if (auth?.token && data?.unit.courseId) {
      const chunkIndex = chunk ? parseInt(chunk as string) : 0;
      axios.put(
        `/api/course-registrations/${data.unit.courseId}/progress`,
        {
          lastVisitedUnitNumber: parseInt(unitNumber),
          lastVisitedChunkIndex: chunkIndex,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      ).catch(() => {
        // Silently fail - not critical if progress update fails
      });
    }
  }, [auth?.token, data?.unit.courseId, unitNumber, chunk]);

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

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  return (
    <UnitLayout
      chunks={data.chunks}
      unit={data.unit}
      unitNumber={parseInt(unitNumber)}
      units={data.units}
    />
  );
};

CourseUnitPage.hideFooter = true;

export default CourseUnitPage;
