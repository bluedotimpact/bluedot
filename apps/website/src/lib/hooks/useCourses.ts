import { trpc } from '../../utils/trpc';

export const useCourses = () => {
  const { data: courses, isLoading: loading, error } = trpc.courses.getAll.useQuery();

  // Filter for courses that should be displayed on the course hub index
  const filteredCourses = (courses ?? []).filter((course) => course.displayOnCourseHubIndex);

  // Sort courses: featured first, then new, then alphabetically by title
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    // Featured courses come first
    if (a.isFeatured && !b.isFeatured) {
      return -1;
    }

    if (!a.isFeatured && b.isFeatured) {
      return 1;
    }

    // Among non-featured courses, new courses come first
    if (!a.isFeatured && !b.isFeatured) {
      if (a.isNew && !b.isNew) {
        return -1;
      }

      if (!a.isNew && b.isNew) {
        return 1;
      }
    }

    // Finally, sort alphabetically by title
    const titleA = a.title;
    const titleB = b.title;
    return titleA.localeCompare(titleB);
  });

  return {
    courses: sortedCourses,
    loading,
    error,
  };
};
