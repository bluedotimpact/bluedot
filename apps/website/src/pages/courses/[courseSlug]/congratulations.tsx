import { ProgressDots } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { trpc } from '../../../utils/trpc';
import CourseCompletionSection from '../../../components/courses/CourseCompletionSection';
import { isCongratulationsAccessible } from '../../../components/courses/SidebarCertificatePanel';

// eslint-disable-next-line react/function-component-definition
export default function CongratulationsPage() {
  const router = useRouter();
  const { courseSlug } = router.query as { courseSlug: string };

  const { data: courseData, isLoading: isCourseLoading } = trpc.courses.getBySlug.useQuery(
    { courseSlug },
    { enabled: Boolean(courseSlug) },
  );

  const { data: certificateData, isLoading: isCertLoading } = trpc.certificates.getStatus.useQuery(
    { courseId: courseData?.course.id ?? '' },
    { enabled: Boolean(courseData?.course.id) },
  );

  if (!isCertLoading && !isCongratulationsAccessible(certificateData)) {
    router.replace(`/courses/${courseSlug}/1/1`); // Redirect to first chunk if not eligible for congratulations page
    return null;
  }

  if (isCourseLoading || isCertLoading || !courseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ProgressDots />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-canvas">
      <CourseCompletionSection
        courseId={courseData.course.id}
        courseTitle={courseData.course.title}
        courseSlug={courseSlug}
        className="px-5 md:px-[60px] lg:px-[100px] xl:px-[140px] 2xl:px-[200px] py-12"
      />
    </div>
  );
}
