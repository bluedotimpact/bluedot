import useAxios from 'axios-hooks';
import type { GetCoursesResponse } from '../../pages/api/courses';

export const useCourses = () => {
  const [{ data, loading, error }] = useAxios<GetCoursesResponse>({
    url: '/api/courses',
    method: 'POST',
  });

  // Sort courses alphabetically by title (since isFeatured and isNew don't exist in new schema)
  const sortedCourses = [...(data?.courses ?? [])].sort((a, b) => {
    const titleA = a.title || '';
    const titleB = b.title || '';
    return titleA.localeCompare(titleB);
  });

  return {
    courses: sortedCourses,
    loading,
    error,
  };
};
