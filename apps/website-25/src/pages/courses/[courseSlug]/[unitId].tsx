import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import axios from 'axios';
import UnitLayout from '../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../api/courses/[courseSlug]/[unitId]';
import { GetCourseRegistrationResponse } from '../../api/course-registrations/[courseId]';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data, loading, error }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}`,
  });

  // If we're logged in, ensures a course registration is recorded for this course
  const auth = useAuthStore((s) => s.auth);
  const shouldRecordCourseRegistration = !!(auth && data?.unit.courseId);
  useEffect(() => {
    if (shouldRecordCourseRegistration) {
      axios.get<GetCourseRegistrationResponse>(`/api/course-registrations/${data?.unit.courseId}`, {
        headers: {
          Authorization: `Bearer ${auth?.token}`,
        },
      });
    }
  }, [shouldRecordCourseRegistration]);

  const unitNumber = typeof unitId === 'string' ? parseInt(unitId) : 0;

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  return (
    <UnitLayout
      unit={data.unit}
      units={data.units}
      unitNumber={unitNumber}
    />
  );
};

export default CourseUnitPage;
