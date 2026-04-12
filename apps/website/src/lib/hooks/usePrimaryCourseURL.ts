import { useCallback } from 'react';
import { useAuthStore } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

const SPECIAL_COURSE_DESTINATIONS: Record<string, string> = {
  'technical-ai-safety-project': '/programs/technical-ai-safety-project-sprint',
};

export const getDefaultCourseURL = (courseSlug: string): string => {
  return SPECIAL_COURSE_DESTINATIONS[courseSlug] ?? `/courses/${courseSlug}`;
};

/**
 * Provides a function `getPrimaryCourseURL` to get the primary URL for any course.
 * - In progress -> /courses/{slug}/1/1 (course content)
 * - Otherwise -> /courses/{slug} (lander page)
 */
export const usePrimaryCourseURL = () => {
  const isLoggedIn = !!useAuthStore((s) => s.auth);
  const { data: coursesData } = trpc.courses.getAll.useQuery();
  // Only fetch registrations when user is logged in (this endpoint requires auth)
  const { data: registrations } = trpc.courseRegistrations.getAll.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const getPrimaryCourseURL = useCallback((courseSlug: string): string => {
    const course = coursesData?.find((c) => c.slug === courseSlug);

    // Fallback to lander url while loading
    if (!course) {
      return getDefaultCourseURL(courseSlug);
    }

    const registration = registrations?.find((r) => r.courseId === course.id);
    const isInProgress = registration?.roundStatus === 'Active';

    if (isInProgress) {
      return `/courses/${courseSlug}/1/1`;
    }

    return getDefaultCourseURL(courseSlug);
  }, [coursesData, registrations]);

  return { getPrimaryCourseURL };
};
