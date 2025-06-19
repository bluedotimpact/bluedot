import useAxios from 'axios-hooks';
import type { GetCoursesResponse } from '../../pages/api/courses';

export const useCourses = () => {
  const [{ data, loading, error }] = useAxios<GetCoursesResponse>({
    url: '/api/courses',
    method: 'POST',
  });

  // Sort courses: featured first, then new, then alphabetically
  const sortedCourses = [...(data?.courses ?? [])].sort((a, b) => {
    // Featured courses come first
    if (!!a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && !!b.isFeatured) return 1;

    // Then new courses
    if (!!a.isNew && !b.isNew) return -1;
    if (!a.isNew && !!b.isNew) return 1;

    // Finally sort alphabetically by title
    return a.title.localeCompare(b.title);
  });

  return {
    courses: sortedCourses,
    loading,
    error,
  };
};
