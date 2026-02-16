import {
  and,
  chunkTable, eq, type Exercise, exerciseTable, inArray, type UnitResource, unitResourceTable,
} from '@bluedot/db';
import { ProgressDots, useAuthStore, useLatestUtmParams } from '@bluedot/ui';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import path from 'path';
import { useEffect } from 'react';
import UnitLayout from '../../../../components/courses/UnitLayout';
import db from '../../../../lib/api/db';
import { FOAI_COURSE_ID } from '../../../../lib/constants';
import { buildCourseUnitUrl } from '../../../../lib/utils';
import { getCourseData } from '../../../../server/routers/courses';
import { fileExists } from '../../../../utils/fileExists';
import { trpc } from '../../../../utils/trpc';

type CourseUnitChunkPageProps = UnitWithChunks & {
  courseSlug: string;
  unitNumber: string;
  courseOgImage: string;
  allUnitChunks: Record<string, BasicChunk[]>;
};

/** Chunk info only used for display (no resources/exercises) */
export type BasicChunk = {
  id: string;
  chunkTitle: string;
  chunkOrder: string;
  estimatedTime: number | null;
};

const CourseUnitChunkPage = ({
  units, unit, chunks, courseSlug, unitNumber, courseOgImage, allUnitChunks,
}: CourseUnitChunkPageProps) => {
  const router = useRouter();
  const {
    query: {
      chunkNumber, chunk: legacyChunkParam,
    },
  } = router;

  // Handle old ?chunk={n-1} format redirect
  useEffect(() => {
    if (typeof legacyChunkParam === 'string') {
      const oldChunkIndex = parseInt(legacyChunkParam, 10);
      if (!Number.isNaN(oldChunkIndex) && oldChunkIndex >= 0) {
        const newChunkNumber = oldChunkIndex + 1;
        router.replace(buildCourseUnitUrl({ courseSlug, unitNumber, chunkNumber: newChunkNumber }));
      }
    }
  }, [courseSlug, unitNumber, legacyChunkParam, router]);

  // Redirect /course/course-name/1 -> /course/course-name/1/1 (to the first chunk)
  useEffect(() => {
    if (!Array.isArray(chunkNumber)) {
      router.replace(buildCourseUnitUrl({ courseSlug, unitNumber }));
    }
  }, [courseSlug, unitNumber, chunkNumber, router]);

  const auth = useAuthStore((s) => s.auth);

  let actualChunkNumber = '1';
  // [[...chunkNumber]] catch-all syntax results in `chunkNumber` being an array, parse the first element
  if (Array.isArray(chunkNumber) && chunkNumber.length > 0) {
    const [firstChunk] = chunkNumber;
    actualChunkNumber = firstChunk ?? '1';
  }

  // Map 1 -> 0, to avoid ugly urls like /courses/my-course/1/0
  const parsedChunk = Number.parseInt(actualChunkNumber, 10);
  const isInvalidChunk = !Number.isFinite(parsedChunk) || parsedChunk < 1;
  const chunkIndex = isInvalidChunk ? 0 : parsedChunk - 1;

  // Track visits to Unit 1 of Future of AI course
  useEffect(() => {
    if (courseSlug === 'future-of-ai' && unitNumber === '1' && typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'starters',
        course_slug: courseSlug,
      });
    }
  }, [courseSlug, unitNumber]);

  const { latestUtmParams } = useLatestUtmParams();
  const { mutate: createCourseRegistrationMutation } = trpc.courseRegistrations.ensureExists.useMutation();

  const { data: applyCTAProps } = trpc.courseRounds.getApplyCTAProps.useQuery({ courseSlug });

  useEffect(() => {
    // FoAI course only: If we're logged in, ensures a course registration is recorded
    const shouldRecordCourseRegistration = auth && (unit.courseId === FOAI_COURSE_ID);
    if (shouldRecordCourseRegistration) {
      createCourseRegistrationMutation({ courseId: unit.courseId, source: latestUtmParams.utm_source });
    }
  }, [auth, unit.courseId, latestUtmParams.utm_source, createCourseRegistrationMutation]);

  useEffect(() => {
    if (chunks && (chunkIndex < 0 || chunkIndex >= chunks.length)) {
      router.replace(buildCourseUnitUrl({ courseSlug, unitNumber }));
    }
  }, [chunkIndex, courseSlug, unitNumber, router, chunks]);

  const handleSetChunkIndex = (newIndex: number) => {
    router.push(buildCourseUnitUrl({ courseSlug, unitNumber, chunkNumber: newIndex + 1 }));
  };

  if (chunkIndex < 0 || chunkIndex >= chunks.length) {
    return <ProgressDots />;
  }

  const chunk = chunks[chunkIndex];
  const title = `${unit.courseTitle}: Unit ${unitNumber}${chunk?.chunkTitle ? ` | ${chunk.chunkTitle}` : ''}`;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const metaDescription = chunk?.metaDescription || unit.title;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDescription} />

        {/* Open Graph meta tags */}
        <meta key="og:title" property="og:title" content={title} />
        <meta key="og:description" property="og:description" content={metaDescription} />
        <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:url" property="og:url" content={`https://bluedot.org/courses/${encodeURIComponent(courseSlug)}/${unitNumber}/${chunkIndex + 1}`} />
        <meta key="og:image" property="og:image" content={courseOgImage} />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/png" />
        <meta key="og:image:alt" property="og:image:alt" content={`${unit.courseTitle} course preview`} />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={courseOgImage} />
      </Head>
      <UnitLayout
        chunks={chunks}
        unit={unit}
        units={units}
        unitNumber={unitNumber}
        chunkIndex={chunkIndex}
        setChunkIndex={handleSetChunkIndex}
        courseSlug={courseSlug}
        allUnitChunks={allUnitChunks}
        applyCTAProps={applyCTAProps ?? undefined}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<CourseUnitChunkPageProps> = async ({ params }) => {
  const { courseSlug, unitNumber } = params ?? {};

  if (typeof courseSlug !== 'string') {
    throw new Error('Invalid course slug');
  }

  if (typeof unitNumber !== 'string') {
    throw new Error('Invalid unit number');
  }

  try {
    const unitWithContent = await getUnitWithChunks(courseSlug, unitNumber);

    // Check for course-specific OG image, fallback to default BlueDot logo
    let courseOgImage = 'https://bluedot.org/images/logo/link-preview-fallback.png';
    if (await fileExists(path.join(process.cwd(), 'public', 'images', 'courses', 'link-preview', `${courseSlug}.png`))) {
      courseOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/courses/link-preview/${courseSlug}.png`;
    }

    return {
      props: {
        ...unitWithContent,
        courseSlug,
        unitNumber,
        courseOgImage,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return { notFound: true };
    }

    throw error;
  }
};

type UnitWithChunks = Awaited<ReturnType<typeof getUnitWithChunks>>;
async function getUnitWithChunks(courseSlug: string, unitNumber: string) {
  const { units } = await getCourseData(courseSlug);

  const unit = units.find((u) => Number(u.unitNumber) === Number(unitNumber));
  if (!unit) {
    throw new Error('NOT_FOUND');
  }

  // Fetch active chunks for all units in this course
  const unitIds = units.map((u) => u.id);
  const activeChunksForCourse = await db.pg
    .select()
    .from(chunkTable.pg)
    .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)));

  // Group chunks by unit ID and extract only the fields needed for sidebar
  const allUnitChunks: Record<string, BasicChunk[]> = {};
  for (const u of units) {
    const unitChunks = activeChunksForCourse
      .filter((c) => c.unitId === u.id)
      .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder))
      .map((c) => ({
        id: c.id,
        chunkTitle: c.chunkTitle,
        chunkOrder: c.chunkOrder,
        estimatedTime: c.estimatedTime,
      }));
    allUnitChunks[u.id] = unitChunks;
  }

  // Get chunks for current unit (with full resources/exercises)
  const currentUnitChunks = activeChunksForCourse
    .filter((chunk) => chunk.unitId === unit.id)
    .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder));

  const chunkResourceIds = currentUnitChunks.flatMap((chunk) => chunk.chunkResources || []);
  const chunkExerciseIds = currentUnitChunks.flatMap((chunk) => chunk.chunkExercises || []);

  const [allResourcesForUnit, allExercisesForUnit] = await Promise.all([
    chunkResourceIds.length > 0
      ? db.pg.select().from(unitResourceTable.pg).where(inArray(unitResourceTable.pg.id, chunkResourceIds))
      : [],
    chunkExerciseIds.length > 0
      ? db.pg
        .select()
        .from(exerciseTable.pg)
        .where(and(eq(exerciseTable.pg.status, 'Active'), inArray(exerciseTable.pg.id, chunkExerciseIds)))
      : [],
  ]);

  const resourceById = new Map(allResourcesForUnit.map((resource) => [resource.id, resource]));
  const exerciseById = new Map(allExercisesForUnit.map((exercise) => [exercise.id, exercise]));

  const chunksWithContent = currentUnitChunks.map((chunk) => {
    // Use pre-fetched resources/exercises for the current unit to avoid N+1 queries, filter out any that might be missing, and sort by readingOrder/exerciseNumber
    const resources = (chunk.chunkResources || [])
      .map((resourceId) => resourceById.get(resourceId))
      .filter((r): r is UnitResource => r !== undefined)
      .sort((a, b) => {
        const orderA = Number(a.readingOrder) || Infinity;
        const orderB = Number(b.readingOrder) || Infinity;
        return orderA - orderB;
      });

    const exercises = (chunk.chunkExercises || [])
      .map((exerciseId) => exerciseById.get(exerciseId))
      .filter((e): e is Exercise => e !== undefined)
      .sort((a, b) => {
        const numA = Number(a.exerciseNumber) || Infinity;
        const numB = Number(b.exerciseNumber) || Infinity;
        return numA - numB;
      });

    return {
      ...chunk,
      resources,
      exercises,
    };
  });

  return {
    units,
    unit,
    chunks: chunksWithContent,
    allUnitChunks,
  };
}

CourseUnitChunkPage.hideFooter = true;

export default CourseUnitChunkPage;
