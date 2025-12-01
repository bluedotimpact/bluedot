import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import {
  Section,
  CTALinkOrButton,
  ErrorSection,
  useAuthStore,
} from '@bluedot/ui';
import {
  FaBars, FaChevronRight, FaChevronDown,
} from 'react-icons/fa6';

import {
  Unit,
  type Chunk,
  type Exercise,
  type UnitResource,
} from '@bluedot/db';
import { skipToken } from '@tanstack/react-query';
import ActionPlanCard from './ActionPlanCard';
import CertificateLinkCard from './CertificateLinkCard';
import Congratulations from './Congratulations';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import KeyboardNavMenu from './KeyboardNavMenu';
import { MobileCourseModal } from './MobileCourseModal';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import { ResourceDisplay } from './ResourceDisplay';
import SideBar from './SideBar';
import { ROUTES } from '../../lib/routes';
import {
  A, H1, P,
} from '../Text';
import { trpc } from '../../utils/trpc';

const CourseIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect className="fill-bluedot-normal" width="40" height="40" rx="8" />
    <path d="M31.9941 21.4938L28.4941 24.9938C28.3299 25.158 28.1072 25.2502 27.875 25.2502C27.6428 25.2502 27.4201 25.158 27.2559 24.9938C27.0918 24.8296 26.9995 24.6069 26.9995 24.3747C26.9995 24.1425 27.0918 23.9198 27.2559 23.7556L29.263 21.7497H19.487L13.362 27.8747H16.5C16.7321 27.8747 16.9546 27.9669 17.1187 28.131C17.2828 28.2951 17.375 28.5176 17.375 28.7497C17.375 28.9818 17.2828 29.2043 17.1187 29.3684C16.9546 29.5325 16.7321 29.6247 16.5 29.6247H11.25C11.0179 29.6247 10.7954 29.5325 10.6313 29.3684C10.4672 29.2043 10.375 28.9818 10.375 28.7497V23.4997C10.375 23.2676 10.4672 23.0451 10.6313 22.881C10.7954 22.7169 11.0179 22.6247 11.25 22.6247C11.4821 22.6247 11.7046 22.7169 11.8687 22.881C12.0328 23.0451 12.125 23.2676 12.125 23.4997V26.6377L18.25 20.5127V10.7367L16.2441 12.7438C16.0799 12.908 15.8572 13.0002 15.625 13.0002C15.3928 13.0002 15.1701 12.908 15.0059 12.7438C14.8418 12.5796 14.7495 12.3569 14.7495 12.1247C14.7495 11.8925 14.8418 11.6698 15.0059 11.5056L18.5059 8.00564C18.5872 7.92429 18.6837 7.85976 18.7899 7.81572C18.8961 7.77169 19.01 7.74902 19.125 7.74902C19.24 7.74902 19.3538 7.77169 19.4601 7.81572C19.5663 7.85976 19.6628 7.92429 19.7441 8.00564L23.2441 11.5056C23.4082 11.6698 23.5005 11.8925 23.5005 12.1247C23.5005 12.3569 23.4082 12.5796 23.2441 12.7438C23.0799 12.908 22.8572 13.0002 22.625 13.0002C22.3928 13.0002 22.1701 12.908 22.0059 12.7438L20 10.7367V19.9997H29.263L27.2559 17.9938C27.0918 17.8296 26.9995 17.6069 26.9995 17.3747C26.9995 17.1425 27.0918 16.9198 27.2559 16.7556C27.4201 16.5915 27.6428 16.4992 27.875 16.4992C28.1072 16.4992 28.3299 16.5915 28.4941 16.7556L31.9941 20.2556C32.0754 20.3369 32.14 20.4334 32.184 20.5396C32.228 20.6459 32.2507 20.7597 32.2507 20.8747C32.2507 20.9897 32.228 21.1036 32.184 21.2098C32.14 21.316 32.0754 21.4125 31.9941 21.4938Z" fill="white" />
  </svg>
);

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
          <CourseIcon />
          <div className="mobile-unit-header__course-title-container flex flex-col text-left">
            <p className="mobile-unit-header__course-breadcrumb text-[12px] font-medium leading-[140%] tracking-[-0.5%] text-[#6A6F7A]">{unit.courseTitle}</p>
            <div className="mobile-unit-header__course-title-row flex items-center gap-1">
              <p className="mobile-unit-header__course-title text-[13px] font-semibold leading-[100%] tracking-[-0.5%] text-[#13132E]">{unit.title}</p>
              <FaChevronDown className="size-3 text-[#13132E]" />
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
}) => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const [navigationAnnouncement, setNavigationAnnouncement] = useState('');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileCourseMenuOpen, setIsMobileCourseMenuOpen] = useState(false);
  const unitArrIndex = units.findIndex((u) => u.id === unit.id);

  const { data: groupDiscussionWithZoomInfo, error: groupDiscussionError } = trpc.groupDiscussions.getByCourseSlug.useQuery(
    auth
      ? { courseSlug } : skipToken,
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
      router.push(`/courses/${courseSlug}/${prevUnit.unitNumber}/${lastChunkNumber}`);
      setNavigationAnnouncement(`Navigated to previous unit: ${prevUnit.title}`);
    } else if (!isFirstChunk) {
      // Navigate to previous chunk
      handleChunkSelect(chunkIndex - 1);
    }
  }, [isFirstChunk, chunks.length, prevUnit, chunkIndex, router, handleChunkSelect, courseSlug]);

  const handleNextClick = useCallback(() => {
    if ((isLastChunk || chunks.length === 0) && nextUnit) {
      // Navigate to first chunk of next unit
      router.push(`/courses/${courseSlug}/${nextUnit.unitNumber}/1`);
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
      />

      {/* Sidebar - positioned fixed and separate from main layout flow */}
      {!isSidebarHidden && (
        <SideBar
          courseTitle={unit.courseTitle}
          className="hidden md:block md:fixed md:overflow-y-auto md:max-h-[calc(100vh-57px)]" // Adjust for Nav height only
          units={units}
          currentUnitNumber={parseInt(unitNumber)}
          chunks={chunks}
          currentChunkIndex={chunkIndex}
          onChunkSelect={handleChunkSelect}
        />
      )}

      {/* Breadcrumbs bar - positioned sticky and full width */}
      <div className={clsx(
        'unit__breadcrumbs-wrapper hidden md:block md:sticky md:top-(--nav-height-mobile) lg:top-(--nav-height-desktop) z-10 border-b-[0.5px] border-[rgba(19,19,46,0.2)] h-[48px] bg-color-canvas',
        isSidebarHidden ? 'md:ml-0' : 'md:ml-[360px]',
      )}
      >
        <div className="flex flex-row justify-between items-center size-full px-6 gap-2">
          {/* Left section: Hide/Show Toggle */}
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setIsSidebarHidden(!isSidebarHidden)}
              className="flex items-center gap-[8px] text-[13px] font-medium text-[#13132E] hover:opacity-80 transition-opacity cursor-pointer"
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
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline"
            >
              Courses
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <A
              href={unit.coursePath}
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline truncate"
            >
              {unit.courseTitle}
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <span className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] truncate" title={`${unitNumber}. ${unit.title}`}>
              {unitNumber}. {unit.title}
            </span>
          </nav>

          {/* Right section: Navigation */}
          <div className="flex items-center gap-[20px] min-h-[18px]">
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={isFirstChunk && !prevUnit}
              onClick={handlePrevClick}
              aria-label="Previous"
              title="Navigate to previous section (use ← arrow key)"
            >
              ← Prev
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
      <div className={clsx('block md:top-16 bg-color-canvas', isSidebarHidden ? 'md:ml-0' : 'md:ml-[360px]')}>
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
              // If the discussion has a courseBuilderUnitRecordId that matches current unit, stay here
              onClickPrepare={() => {
                if (groupDiscussionWithZoomInfo.groupDiscussion!.courseBuilderUnitRecordId === unit.id) {
                  handleChunkSelect(0);
                } else if (groupDiscussionWithZoomInfo.groupDiscussion!.unitNumber) {
                  // Otherwise, try to navigate to the discussion's unit number
                  const discussionUnit = units.find((u) => u.unitNumber === groupDiscussionWithZoomInfo.groupDiscussion!.unitNumber?.toString());
                  if (discussionUnit) {
                    router.push(discussionUnit.path);
                  } else {
                    handleChunkSelect(0); // fallback to current unit
                  }
                } else {
                  handleChunkSelect(0); // fallback to current unit
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Main content section */}
      <Section className="unit__main !border-none !pt-0 !mt-0">
        <div className={clsx(
          'unit__content flex flex-col flex-1 max-w-full md:max-w-[680px] lg:max-w-[800px] xl:max-w-[900px] mx-auto px-5 sm:px-spacing-x pt-6 md:pt-8',
          !isSidebarHidden && 'md:ml-[360px]',
        )}
        >
          <div className="unit__title-container">
            <P className="unit__course-title font-semibold text-[13px] leading-[140%] tracking-[0.04em] uppercase text-bluedot-normal mb-2">Unit {unit.unitNumber}: {unit.title}</P>
            {chunk?.chunkTitle && (
              <H1 className="unit__title font-bold text-[32px] leading-[130%] tracking-[-0.015em] text-[#13132E]">{chunk.chunkTitle}</H1>
            )}
          </div>
          {/* chunk content → unit content if no chunks - Only render if there's actual content */}
          {(chunk?.chunkContent || unit.content) && (
            <MarkdownExtendedRenderer className="mt-8 md:mt-6">
              {chunk?.chunkContent || unit.content || ''}
            </MarkdownExtendedRenderer>
          )}

          {/* Chunk resources and exercises - Show if there are any resources or exercises */}
          {chunk && (chunk.resources?.length || chunk.exercises?.length) ? (
            <ResourceDisplay
              resources={chunk.resources || []}
              exercises={chunk.exercises || []}
              unitTitle={unit.title}
              unitNumber={parseInt(unitNumber)}
              className={clsx(
                (chunk?.chunkContent || unit.content) ? 'mt-8 md:mt-6' : 'mt-4',
              )}
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

      <MobileCourseModal
        isOpen={isMobileCourseMenuOpen}
        setIsOpen={setIsMobileCourseMenuOpen}
        courseTitle={unit.courseTitle}
        units={units}
        currentUnitNumber={parseInt(unitNumber)}
        chunks={chunks}
        currentChunkIndex={chunkIndex}
        onChunkSelect={handleMobileChunkSelect}
        onUnitSelect={handleMobileUnitSelect}
      />
    </div>
  );
};

export default UnitLayout;
