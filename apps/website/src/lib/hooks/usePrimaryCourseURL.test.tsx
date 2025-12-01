import { renderHook, waitFor } from '@testing-library/react';
import {
  describe, expect, it, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockCourse, createMockCourseRegistration } from '../../__tests__/testUtils';
import { usePrimaryCourseURL } from './usePrimaryCourseURL';

describe('usePrimaryCourseURL', () => {
  beforeEach(() => {
    // Default: no courses, no registrations
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
  });

  it('returns lander URL when course not found', async () => {
    const { result } = renderHook(() => usePrimaryCourseURL(), {
      wrapper: TrpcProvider,
    });

    await waitFor(() => {
      expect(result.current.getPrimaryCourseURL('unknown-course')).toBe('/courses/unknown-course');
    });
  });

  it('returns lander URL when user is not enrolled', async () => {
    const mockCourse = createMockCourse({
      id: 'course-1',
      slug: 'future-of-ai',
      title: 'The Future of AI',
    });

    server.use(trpcMsw.courses.getAll.query(() => [mockCourse]));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));

    const { result } = renderHook(() => usePrimaryCourseURL(), {
      wrapper: TrpcProvider,
    });

    await waitFor(() => {
      expect(result.current.getPrimaryCourseURL('future-of-ai')).toBe('/courses/future-of-ai');
    });
  });

  it('returns content URL when user is enrolled and course is in progress', async () => {
    const courseId = 'course-1';
    const mockCourse = createMockCourse({
      id: courseId,
      slug: 'agi-strategy',
      title: 'AGI Strategy',
    });
    const mockRegistration = createMockCourseRegistration({
      courseId,
      roundStatus: 'Active',
    });

    server.use(trpcMsw.courses.getAll.query(() => [mockCourse]));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => [mockRegistration]));

    const { result } = renderHook(() => usePrimaryCourseURL(), {
      wrapper: TrpcProvider,
    });

    await waitFor(() => {
      expect(result.current.getPrimaryCourseURL('agi-strategy')).toBe('/courses/agi-strategy/1/1');
    });
  });

  it('returns lander URL when roundStatus is not Active', async () => {
    const courseId = 'course-1';
    const mockCourse = createMockCourse({
      id: courseId,
      slug: 'technical-ai-safety',
      title: 'Technical AI Safety',
    });
    const mockRegistration = createMockCourseRegistration({
      courseId,
      roundStatus: 'Completed',
    });

    server.use(trpcMsw.courses.getAll.query(() => [mockCourse]));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => [mockRegistration]));

    const { result } = renderHook(() => usePrimaryCourseURL(), {
      wrapper: TrpcProvider,
    });

    await waitFor(() => {
      expect(result.current.getPrimaryCourseURL('technical-ai-safety')).toBe('/courses/technical-ai-safety');
    });
  });

  it('works for multiple courses in the same component', async () => {
    const course1 = createMockCourse({ id: 'course-1', slug: 'course-1' });
    const course2 = createMockCourse({ id: 'course-2', slug: 'course-2' });
    const registration1 = createMockCourseRegistration({
      courseId: 'course-1',
      roundStatus: 'Active',
    });

    server.use(trpcMsw.courses.getAll.query(() => [course1, course2]));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => [registration1]));

    const { result } = renderHook(() => usePrimaryCourseURL(), {
      wrapper: TrpcProvider,
    });

    await waitFor(() => {
      // Enrolled in course-1
      expect(result.current.getPrimaryCourseURL('course-1')).toBe('/courses/course-1/1/1');
      // Not enrolled in course-2
      expect(result.current.getPrimaryCourseURL('course-2')).toBe('/courses/course-2');
    });
  });
});
