import {
  CTALinkOrButton,
  ErrorSection,
  H1,
  P,
  Section,
  useAuthStore,
} from '@bluedot/ui';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import type React from 'react';
import { useCallback, useState } from 'react';

import {
  type Chunk,
  type Exercise,
  type Unit,
  type UnitResource,
} from '@bluedot/db';
import { useBugReport } from '../../hooks/useBugReport';
import { buildCourseUnitUrl } from '../../lib/utils';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import { trpc } from '../../utils/trpc';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import InactiveCourseBanners from './InactiveCourseBanners';
import KeyboardNavMenu from './KeyboardNavMenu';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import { ResourceDisplay } from './ResourceDisplay';
import type { ApplyCTAProps } from './SideBar';
import CourseShell from './CourseShell';

export type ChunkWithContent = Chunk & {
  resources: UnitResource[];
  exercises: Exercise[];
};

type UnitLayoutProps = {
  // Required
  chunks: ChunkWithContent[];
  unit: Unit;
  unitNumber: string;
  units: Unit[];
  chunkIndex: number;
  setChunkIndex: (index: number) => void;
  courseSlug: string;
  allUnitChunks: Record<string, BasicChunk[]>;
  // Optional
  applyCTAProps?: ApplyCTAProps;
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  chunks,
  unit,
  unitNumber,
  units,
  chunkIndex,
  setChunkIndex,
  courseSlug,
  allUnitChunks,
  applyCTAProps,
}) => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const { openBugReport } = useBugReport();

  const [navigationAnnouncement, setNavigationAnnouncement] = useState('');
  const unitArrIndex = units.findIndex((u) => u.id === unit.id);

  const { data: groupDiscussionWithZoomInfo, error: groupDiscussionError } = trpc.groupDiscussions.getByCourseSlug.useQuery(
    { courseSlug },
    { enabled: Boolean(auth) },
  );

  const { data: courseProgressData } = trpc.courses.getCourseProgress.useQuery(
    { courseSlug },
    { enabled: Boolean(auth) },
  );

  const { data: certificateData } = trpc.certificates.getStatus.useQuery({ courseId: unit.courseId });

  const isFirstChunk = chunkIndex === 0;
  const isLastChunk = chunkIndex === chunks.length - 1;
  const chunk = chunks[chunkIndex];

  const nextUnit = units[unitArrIndex + 1];
  const prevUnit = units[unitArrIndex - 1];

  const handleChunkSelect = useCallback((index: number) => {
    setChunkIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Announce navigation for screen readers
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const chunkTitle = chunks[index]?.chunkTitle || 'content';
    setNavigationAnnouncement(`Navigated to ${chunkTitle}`);
  }, [setChunkIndex, chunks]);

  const handlePrevClick = useCallback(() => {
    if ((isFirstChunk || chunks.length === 0) && prevUnit) {
      // Navigate to last chunk of previous unit
      const lastChunkNumber = prevUnit.chunks?.length ?? 1;
      router.push(buildCourseUnitUrl({ courseSlug, unitNumber: prevUnit.unitNumber, chunkNumber: lastChunkNumber }));
      setNavigationAnnouncement(`Navigated to previous unit: ${prevUnit.title}`);
    } else if (!isFirstChunk) {
      // Navigate to previous chunk
      handleChunkSelect(chunkIndex - 1);
    }
  }, [isFirstChunk, chunks.length, prevUnit, chunkIndex, router, handleChunkSelect, courseSlug]);

  const handleNextClick = useCallback(() => {
    if ((isLastChunk || chunks.length === 0) && nextUnit) {
      // Navigate to first chunk of next unit
      router.push(buildCourseUnitUrl({ courseSlug, unitNumber: nextUnit.unitNumber }));
      setNavigationAnnouncement(`Navigated to next unit: ${nextUnit.title}`);
    } else if (!isLastChunk) {
      // Navigate to next chunk
      handleChunkSelect(chunkIndex + 1);
    }
  }, [isLastChunk, chunks.length, nextUnit, chunkIndex, router, handleChunkSelect, courseSlug]);

  if (!unit || unitArrIndex === -1) {
    // Should never happen
    throw new Error('Unit not found');
  }

  return (
    <CourseShell
      courseSlug={courseSlug}
      courseTitle={unit.courseTitle}
      units={units}
      allUnitChunks={allUnitChunks}
      certificateData={certificateData}
      currentUnitNumber={parseInt(unitNumber, 10)}
      currentChunkIndex={chunkIndex}
      onChunkSelect={handleChunkSelect}
      onUnitSelect={(unitPath) => router.push(unitPath)}
      applyCTAProps={applyCTAProps}
      courseProgressData={courseProgressData}
      onNavigate={setNavigationAnnouncement}
      breadcrumb={`${unitNumber}. ${unit.title}`}
      navigationControls={(
        <>
          <button
            type="button"
            className="flex items-center gap-1 text-size-xs font-medium leading-[18px] tracking-[-0.005em] text-bluedot-navy hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isFirstChunk && !prevUnit}
            onClick={handlePrevClick}
            aria-label="Previous"
            title="Navigate to previous section (use ← arrow key)"
          >
            ← Prev
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-size-xs font-medium leading-[18px] tracking-[-0.005em] text-bluedot-navy hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isLastChunk && !nextUnit}
            onClick={handleNextClick}
            aria-label="Next"
            title="Navigate to next section (use → arrow key)"
          >
            Next →
          </button>
        </>
      )}
      mobileNavigation={{
        prevUnit,
        nextUnit,
        isFirstChunk,
        isLastChunk,
        onPrevClick: handlePrevClick,
        onNextClick: handleNextClick,
      }}
    >
      {/* Aria live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {navigationAnnouncement}
      </div>

      <div className="bg-color-canvas">
        {groupDiscussionError && (
          <ErrorSection error={groupDiscussionError} />
        )}
        {/* Group discussion banner - positioned below breadcrumbs */}
        {groupDiscussionWithZoomInfo?.groupDiscussion && (
          <div className="mb-8 md:mb-6">
            <GroupDiscussionBanner
              unit={unit}
              groupDiscussion={groupDiscussionWithZoomInfo.groupDiscussion}
              userRole={groupDiscussionWithZoomInfo.userRole}
              hostKeyForFacilitators={groupDiscussionWithZoomInfo.hostKeyForFacilitators}
            />
          </div>
        )}
        <InactiveCourseBanners courseSlug={courseSlug} />
      </div>

      {/* Main content section */}
      <Section className="unit__main !border-none !pt-0 !mt-0 md:!max-w-none md:!mx-0 md:!px-0">
        <div className="unit__content flex flex-col flex-1 max-w-full md:max-w-[680px] lg:max-w-text-narrow xl:max-w-[900px] mx-auto px-5 sm:px-spacing-x pt-6 md:pt-8">
          <div className="unit__title-container">
            <P className="unit__course-title font-semibold text-size-xs leading-[140%] tracking-[0.04em] uppercase text-bluedot-normal mb-2">Unit {unit.unitNumber}: {unit.title}</P>
            {chunk?.chunkTitle && (
              // eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size -- deferred design pick: standalone H1 in course-unit chrome, fixed 32px is intentional
              <H1 className="unit__title font-bold text-[32px] leading-[130%] tracking-[-0.015em] text-bluedot-navy">{chunk.chunkTitle}</H1>
            )}
          </div>
          {/* chunk content → unit content if no chunks - Only render if there's actual content */}
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {(chunk?.chunkContent || unit.content) && (
            <MarkdownExtendedRenderer className="mt-8 md:mt-6">
              {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
              {chunk?.chunkContent || unit.content || ''}
            </MarkdownExtendedRenderer>
          )}

          {/* Chunk resources and exercises - Show if there are any resources or exercises */}
          {chunk && (chunk.resources?.length || chunk.exercises?.length) ? (
            <ResourceDisplay
              resources={chunk.resources || []}
              exercises={chunk.exercises || []}
              unitTitle={unit.title}
              unitNumber={unitNumber}
              className={clsx((chunk?.chunkContent || unit.content) ? 'mt-8 md:mt-6' : 'mt-4')}
              courseSlug={courseSlug}
              chunkIndex={chunkIndex}
            />
          ) : null}

          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {(nextUnit || !isLastChunk) && (
            // Margin-bottom is added to accommodate the Circle widget on mobile screens
            <div className="unit__cta-container flex flex-row justify-center mt-6 mx-1 mb-14 sm:mb-0">
              <CTALinkOrButton
                className="unit__cta-link [&]:bg-bluedot-normal [&]:hover:bg-[color-mix(in_oklab,var(--bluedot-normal),black_20%)] hover:text-white"
                onClick={handleNextClick}
                variant="primary"
                withChevron
              >
                {isLastChunk ? 'Complete unit and continue' : 'Continue'}
              </CTALinkOrButton>
            </div>
          )}

          {/* Bottom-most section, underneath 'continue' button */}
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {(nextUnit || !isLastChunk) && (
            <div className="hidden md:block">
              <hr className="mt-12 mb-4" />
              <div className="flex items-center justify-between">
                <KeyboardNavMenu />
                <button
                  type="button"
                  onClick={() => openBugReport()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                >
                  Report a bug
                </button>
              </div>
            </div>
          )}
        </div>

      </Section>
    </CourseShell>
  );
};

export default UnitLayout;
