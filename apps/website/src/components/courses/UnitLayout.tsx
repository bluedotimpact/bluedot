import {
  A,
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
import { useCallback, useEffect, useState } from 'react';
import {
  FaBars,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa6';

import {
  type Unit,
  type Chunk,
  type Exercise,
  type UnitResource,
} from '@bluedot/db';
import { ROUTES } from '../../lib/routes';
import { buildCourseUnitUrl } from '../../lib/utils';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import type { CourseProgress } from '../../server/routers/courses';
import { trpc } from '../../utils/trpc';
import ActionPlanCard from './ActionPlanCard';
import CertificateLinkCard from './CertificateLinkCard';
import Congratulations from './Congratulations';
import { CourseIcon } from './CourseIcon';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import KeyboardNavMenu from './KeyboardNavMenu';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import { MobileCourseModal } from './MobileCourseModal';
import { ResourceDisplay } from './ResourceDisplay';
import SideBar, { type ApplyCTAProps } from './SideBar';

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

type MobileHeaderProps = {
  className?: string;
  unit: Unit;
  prevUnit?: Unit;
  nextUnit?: Unit;
  onPrevClick: () => void;
  onNextClick: () => void;
  isFirstChunk: boolean;
  isLastChunk: boolean;
  onCourseMenuClick: () => void;
  courseSlug: string;
  courseProgressData?: CourseProgress;
};

const MobileHeader: React.FC<MobileHeaderProps> = ({
  className,
  unit,
  prevUnit,
  nextUnit,
  isFirstChunk,
  isLastChunk,
  onPrevClick,
  onNextClick,
  onCourseMenuClick,
  courseSlug,
  courseProgressData,
}) => {
  return (
    <div className={clsx('mobile-unit-header bg-color-canvas border-b border-color-divider w-full h-[76px] flex items-center px-3', className)}>
      <nav className="mobile-unit-header__nav flex flex-row items-center justify-between w-full">
        {/* Left side - course info */}
        <button
          type="button"
          className="mobile-unit-header__course-container flex flex-row items-center gap-2 flex-1 cursor-pointer bg-transparent border-none p-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          onClick={onCourseMenuClick}
          aria-label="Open course navigation menu"
        >
          <CourseIcon courseSlug={courseSlug} size="small" />
          <div className="mobile-unit-header__course-title-container flex flex-col justify-center text-left flex-1 min-w-0">
            <div className="mobile-unit-header__course-title-row flex items-center gap-1">
              <p className="mobile-unit-header__course-title text-[17px] font-semibold leading-[120%] tracking-[-0.5%] text-bluedot-navy truncate">{unit.courseTitle}</p>
              <FaChevronDown className="size-3 text-bluedot-navy flex-shrink-0" />
            </div>
          </div>
        </button>

        {/* Right side - navigation arrows */}
        <div className="mobile-unit-header__navigation flex flex-row items-center p-0 w-16 h-8">
          <button
            type="button"
            className="mobile-unit-header__prev-unit-cta flex flex-col justify-center items-center p-0 gap-2 size-8 rounded-full focus:outline-none focus:ring-2 focus:ring-color-primary focus:ring-offset-2"
            disabled={isFirstChunk && !prevUnit}
            onClick={onPrevClick}
            aria-label="Previous unit"
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
              <path
                d="M6.90887 10L6.08856 9.19034L9.46569 5.81321H0.719238V4.64133H9.46569L6.08856 1.27486L6.90887 0.454546L11.6816 5.22727L6.90887 10Z"
                fill={isFirstChunk && !prevUnit ? '#6A6F7A' : '#00114D'}
              />
            </svg>
          </button>
          <button
            type="button"
            className="mobile-unit-header__next-unit-cta flex flex-col justify-center items-center p-0 gap-2 size-8 rounded-full focus:outline-none focus:ring-2 focus:ring-color-primary focus:ring-offset-2"
            disabled={isLastChunk && !nextUnit}
            onClick={onNextClick}
            aria-label="Next unit"
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.90887 10L6.08856 9.19034L9.46569 5.81321H0.719238V4.64133H9.46569L6.08856 1.27486L6.90887 0.454546L11.6816 5.22727L6.90887 10Z"
                fill={isLastChunk && !nextUnit ? '#6A6F7A' : '#00114D'}
              />
            </svg>
          </button>
        </div>
        {courseProgressData && courseProgressData.courseProgress.totalCount > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1">
            <div
              className="h-full bg-bluedot-normal"
              style={{ width: `${courseProgressData.courseProgress.percentage}%` }}
              aria-label={`Course ${courseProgressData.courseProgress.percentage}% complete`}
            />
          </div>
        )}
      </nav>
    </div>
  );
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
  const [navigationAnnouncement, setNavigationAnnouncement] = useState('');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileCourseMenuOpen, setIsMobileCourseMenuOpen] = useState(false);
  const unitArrIndex = units.findIndex((u) => u.id === unit.id);

  const { data: groupDiscussionWithZoomInfo, error: groupDiscussionError } = trpc.groupDiscussions.getByCourseSlug.useQuery(
    { courseSlug },
    { enabled: Boolean(auth) },
  );

  const { data: courseProgressData } = trpc.courses.getCourseProgress.useQuery(
    { courseSlug },
    { enabled: Boolean(auth) },
  );

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

  const handleMobileChunkSelect = useCallback((index: number) => {
    handleChunkSelect(index);
    setIsMobileCourseMenuOpen(false);
  }, [handleChunkSelect]);

  const handleMobileUnitSelect = useCallback((unitPath: string) => {
    router.push(unitPath);
    setIsMobileCourseMenuOpen(false);
  }, [router]);

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

  // Handle keyboard navigation with arrow keys and sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const { activeElement } = document;
      if (activeElement && (
        activeElement.tagName === 'INPUT'
        || activeElement.tagName === 'TEXTAREA'
        || activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // Handle sidebar toggle shortcut: Cmd+B (macOS) or Ctrl+B (Windows/Linux)
      // Use physical key detection (event.code) for consistent behavior across all keyboard layouts
      const isSidebarToggle = event.code === 'KeyB' && !event.altKey && !event.shiftKey && (
        (event.metaKey && !event.ctrlKey) // Cmd+B on macOS
        || (event.ctrlKey && !event.metaKey) // Ctrl+B on Windows/Linux
      );

      if (isSidebarToggle) {
        event.preventDefault();
        setIsSidebarHidden((prev) => !prev);
        return;
      }

      // Ignore if modifier keys are pressed for arrow navigation
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

      // Handle number keys for unit navigation
      if (/^[1-9]$/.test(event.key)) {
        const targetUnitNumber = parseInt(event.key, 10);
        const targetUnit = units.find((u) => Number(u.unitNumber) === targetUnitNumber);
        if (targetUnit) {
          event.preventDefault();
          router.push(targetUnit.path);
          setNavigationAnnouncement(`Navigated to Unit ${targetUnitNumber}: ${targetUnit.title}`);
        }

        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevClick();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextClick();
          break;
        default:
          // Ignore other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handlePrevClick, handleNextClick, router, units]);

  if (!unit || unitArrIndex === -1) {
    // Should never happen
    throw new Error('Unit not found');
  }

  return (
    <div>
      {/* Aria live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="absolute -left-[10000px] size-px overflow-hidden"
      >
        {navigationAnnouncement}
      </div>

      <MobileHeader
        className="unit__mobile-header md:hidden sticky top-(--nav-height-mobile) z-10"
        unit={unit}
        prevUnit={prevUnit}
        nextUnit={nextUnit}
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
        isFirstChunk={isFirstChunk}
        isLastChunk={isLastChunk}
        onCourseMenuClick={() => setIsMobileCourseMenuOpen(true)}
        courseSlug={courseSlug}
        courseProgressData={courseProgressData}
      />

      <div className="md:flex">
        {!isSidebarHidden && (
          <SideBar
            courseTitle={unit.courseTitle}
            courseSlug={courseSlug}
            className="hidden md:block md:sticky md:top-(--nav-height-mobile) lg:top-(--nav-height-desktop) md:overflow-y-auto md:max-h-[calc(100vh-var(--nav-height-mobile))] lg:max-h-[calc(100vh-var(--nav-height-desktop))] md:self-start md:shrink-0"
            units={units}
            currentUnitNumber={parseInt(unitNumber)}
            currentChunkIndex={chunkIndex}
            onChunkSelect={handleChunkSelect}
            unitChunks={allUnitChunks}
            applyCTAProps={applyCTAProps}
            courseProgressData={courseProgressData}
          />
        )}

        <div className="md:flex-1 md:min-w-0">
          {/* Breadcrumbs bar */}
          <div className="unit__breadcrumbs-wrapper hidden md:block md:sticky md:top-(--nav-height-mobile) lg:top-(--nav-height-desktop) z-10 border-b-[0.5px] border-bluedot-navy/20 h-[48px] bg-color-canvas">
            <div className="flex flex-row justify-between items-center size-full px-6 gap-2">
              {/* Left section: Hide/Show Toggle */}
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                  className="flex items-center gap-[8px] text-[13px] font-medium text-bluedot-navy hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
                >
                  <FaBars className="size-[16px]" />
                  <span className="tracking-[-0.005em]">{isSidebarHidden ? 'Show' : 'Hide'}</span>
                </button>
                <span className="w-px h-[18px] bg-[#6A6F7A] opacity-50" />
              </div>

              {/* Breadcrumbs - left aligned after hide */}
              <nav className="flex items-center gap-[8px] flex-1 min-h-[18px] min-w-0">
                <A
                  href={ROUTES.courses.url}
                  className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-bluedot-navy transition-colors no-underline"
                >
                  Courses
                </A>
                <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
                <A
                  href={unit.coursePath}
                  className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-bluedot-navy transition-colors no-underline truncate"
                >
                  {unit.courseTitle}
                </A>
                <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
                <span className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-bluedot-navy truncate" title={`${unitNumber}. ${unit.title}`}>
                  {unitNumber}. {unit.title}
                </span>
              </nav>

              {/* Right section: Navigation */}
              <div className="flex items-center gap-[20px] min-h-[18px]">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-bluedot-navy hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={isFirstChunk && !prevUnit}
                  onClick={handlePrevClick}
                  aria-label="Previous"
                  title="Navigate to previous section (use ← arrow key)"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-bluedot-navy hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={isLastChunk && !nextUnit}
                  onClick={handleNextClick}
                  aria-label="Next"
                  title="Navigate to next section (use → arrow key)"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
          <div className="bg-color-canvas">
            {/* Group discussion banner - positioned below breadcrumbs */}
            {groupDiscussionError && (
              <ErrorSection error={groupDiscussionError} />
            )}
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
          </div>

          {/* Main content section */}
          <Section className="unit__main !border-none !pt-0 !mt-0 md:!max-w-none md:!mx-0 md:!px-0">
            <div className="unit__content flex flex-col flex-1 max-w-full md:max-w-[680px] lg:max-w-[800px] xl:max-w-[900px] mx-auto px-5 sm:px-spacing-x pt-6 md:pt-8">
              <div className="unit__title-container">
                <P className="unit__course-title font-semibold text-[13px] leading-[140%] tracking-[0.04em] uppercase text-bluedot-normal mb-2">Unit {unit.unitNumber}: {unit.title}</P>
                {chunk?.chunkTitle && (
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

              {(!nextUnit && isLastChunk) ? (
                <>
                  <Congratulations
                    courseTitle={unit.courseTitle}
                    coursePath={unit.coursePath}
                    courseId={unit.courseId}
                    className="mt-8 md:mt-6"
                  />
                  <div className="mt-8 md:mt-6">
                    <ActionPlanCard courseId={unit.courseId} />
                  </div>
                  <div className="mt-4">
                    <CertificateLinkCard courseId={unit.courseId} />
                  </div>
                </>
              ) : (
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
              <div className="hidden md:block">
                <hr className="mt-12 mb-4" />
                <KeyboardNavMenu />
              </div>
            </div>
          </Section>
        </div>
      </div>

      <MobileCourseModal
        isOpen={isMobileCourseMenuOpen}
        setIsOpen={setIsMobileCourseMenuOpen}
        courseTitle={unit.courseTitle}
        courseSlug={courseSlug}
        units={units}
        currentUnitNumber={parseInt(unitNumber)}
        currentChunkIndex={chunkIndex}
        onChunkSelect={handleMobileChunkSelect}
        onUnitSelect={handleMobileUnitSelect}
        unitChunks={allUnitChunks}
        applyCTAProps={applyCTAProps}
        courseProgressData={courseProgressData}
      />
    </div>
  );
};

export default UnitLayout;
