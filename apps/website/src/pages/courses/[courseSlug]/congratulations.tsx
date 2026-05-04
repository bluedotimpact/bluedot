import {
  and,
  chunkTable,
  eq,
  inArray,
  type Unit,
} from '@bluedot/db';
import { ProgressDots } from '@bluedot/ui';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import CourseCompletionSection from '../../../components/courses/CourseCompletionSection';
import CourseShell from '../../../components/courses/CourseShell';
import { isCongratulationsAccessible } from '../../../components/courses/SidebarCertificatePanel';
import db from '../../../lib/api/db';
import type { BasicChunk } from './[unitNumber]/[[...chunkNumber]]';
import { getCourseData } from '../../../server/routers/courses';
import { trpc } from '../../../utils/trpc';

type CongratulationsPageProps = {
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  units: Unit[];
  allUnitChunks: Record<string, BasicChunk[]>;
};

// eslint-disable-next-line react/function-component-definition
export default function CongratulationsPage({
  courseSlug,
  courseId,
  courseTitle,
  units,
  allUnitChunks,
}: CongratulationsPageProps) {
  const router = useRouter();

  const { data: certificateData, isLoading: isCertLoading } = trpc.certificates.getStatus.useQuery({ courseId });

  if (!isCertLoading && !isCongratulationsAccessible(certificateData)) {
    router.replace(`/courses/${courseSlug}/1/1`); // Redirect to first chunk if not eligible for congratulations page
    return null;
  }

  if (isCertLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ProgressDots />
      </div>
    );
  }

  return (
    <CourseShell
      courseSlug={courseSlug}
      courseTitle={courseTitle}
      units={units}
      allUnitChunks={allUnitChunks}
      certificateStatusData={certificateData}
      breadcrumb="Congratulations"
    >
      <CourseCompletionSection
        courseId={courseId}
        courseTitle={courseTitle}
        courseSlug={courseSlug}
        className="px-5 md:px-[60px] lg:px-[100px] xl:px-[140px] 2xl:px-[200px] py-12"
      />
    </CourseShell>
  );
}

export const getServerSideProps: GetServerSideProps<CongratulationsPageProps> = async ({ params }) => {
  const { courseSlug } = params ?? {};

  if (typeof courseSlug !== 'string') {
    throw new Error('Invalid course slug');
  }

  try {
    const { course, units } = await getCourseData(courseSlug);

    const unitIds = units.map((u) => u.id);
    const activeChunks = await db.pg
      .select()
      .from(chunkTable.pg)
      .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)));

    const allUnitChunks: Record<string, BasicChunk[]> = {};
    for (const u of units) {
      allUnitChunks[u.id] = activeChunks
        .filter((c) => c.unitId === u.id)
        .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder))
        .map((c) => ({
          id: c.id,
          chunkTitle: c.chunkTitle,
          chunkOrder: c.chunkOrder,
          estimatedTime: c.estimatedTime,
        }));
    }

    return {
      props: {
        courseSlug,
        courseId: course.id,
        courseTitle: course.title,
        units,
        allUnitChunks,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
      return { notFound: true };
    }

    throw error;
  }
};
