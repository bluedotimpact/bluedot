import type { Unit } from '@bluedot/db';
import { A, cn } from '@bluedot/ui';
import { useRouter } from 'next/router';
import type React from 'react';
import { type ReactNode, useEffect, useState } from 'react';
import { FaBars, FaChevronDown, FaChevronRight } from 'react-icons/fa6';
import { ROUTES } from '../../lib/routes';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';
import type { CertificateData } from '../../server/routers/certificates';
import type { CourseProgress } from '../../server/routers/courses';
import { ArrowRightIcon } from '../icons';
import { CourseIcon } from './CourseIcon';
import { MobileCourseModal } from './MobileCourseModal';
import SideBar, { type ApplyCTAProps } from './SideBar';

type MobileNavigation = {
  prevUnit?: Unit;
  nextUnit?: Unit;
  isFirstChunk: boolean;
  isLastChunk: boolean;
  onPrevClick: () => void;
  onNextClick: () => void;
};

type MobileHeaderProps = {
  className?: string;
  courseTitle: string;
  courseSlug: string;
  courseProgressData?: CourseProgress;
  onCourseMenuClick: () => void;
} & MobileNavigation;

const MobileHeader: React.FC<MobileHeaderProps> = ({
  className,
  courseTitle,
  courseSlug,
  prevUnit,
  nextUnit,
  isFirstChunk,
  isLastChunk,
  onPrevClick,
  onNextClick,
  onCourseMenuClick,
  courseProgressData,
}) => (
  <div
    className={cn(
      'mobile-unit-header bg-color-canvas border-color-divider flex h-[76px] w-full items-center border-b px-3',
      className,
    )}
  >
    <nav className="mobile-unit-header__nav flex w-full flex-row items-center justify-between">
      {/* Left side - course info */}
      <button
        type="button"
        className="mobile-unit-header__course-container flex flex-1 cursor-pointer flex-row items-center gap-2 rounded border-none bg-transparent p-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={onCourseMenuClick}
        aria-label="Open course navigation menu"
      >
        <CourseIcon courseSlug={courseSlug} size="small" />
        <div className="mobile-unit-header__course-title-container flex min-w-0 flex-1 flex-col justify-center text-left">
          <div className="mobile-unit-header__course-title-row flex items-center gap-1">
            <p className="mobile-unit-header__course-title text-size-md text-bluedot-navy truncate leading-[120%] font-semibold tracking-[-0.5%]">
              {courseTitle}
            </p>
            <FaChevronDown className="text-bluedot-navy size-3 flex-shrink-0" />
          </div>
        </div>
      </button>
      {/* Right side - navigation arrows */}
      <div className="mobile-unit-header__navigation flex h-8 w-16 flex-row items-center p-0">
        <button
          type="button"
          className="mobile-unit-header__prev-unit-cta focus:ring-color-primary flex size-8 flex-col items-center justify-center gap-2 rounded-full p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          disabled={isFirstChunk && !prevUnit}
          onClick={onPrevClick}
          aria-label="Previous unit"
        >
          <ArrowRightIcon
            aria-hidden="true"
            className={cn('rotate-180', isFirstChunk && !prevUnit ? 'text-[#6A6F7A]' : 'text-bluedot-darker')}
          />
        </button>
        <button
          type="button"
          className="mobile-unit-header__next-unit-cta focus:ring-color-primary flex size-8 flex-col items-center justify-center gap-2 rounded-full p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          disabled={isLastChunk && !nextUnit}
          onClick={onNextClick}
          aria-label="Next unit"
        >
          <ArrowRightIcon
            aria-hidden="true"
            className={isLastChunk && !nextUnit ? 'text-[#6A6F7A]' : 'text-bluedot-darker'}
          />
        </button>
      </div>
      {courseProgressData && courseProgressData.courseProgress.totalCount > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1">
          <div
            className="bg-bluedot-normal h-full"
            style={{ width: `${courseProgressData.courseProgress.percentage}%` }}
            aria-label={`Course ${courseProgressData.courseProgress.percentage}% complete`}
          />
        </div>
      )}
    </nav>
  </div>
);

export type CourseShellProps = {
  courseSlug: string;
  courseTitle: string;
  units: Unit[];
  allUnitChunks: Record<string, BasicChunk[]>;
  certificateData: CertificateData | undefined;
  currentUnitNumber?: number;
  currentChunkIndex?: number;
  onChunkSelect?: (index: number) => void;
  onUnitSelect?: (unitPath: string) => void;
  applyCTAProps?: ApplyCTAProps;
  courseProgressData?: CourseProgress;
  breadcrumb: ReactNode;
  navigationControls?: ReactNode;
  mobileNavigation?: MobileNavigation;
  onNavigate?: (msg: string) => void;
  children: ReactNode;
};

const CourseShell: React.FC<CourseShellProps> = ({
  courseSlug,
  courseTitle,
  units,
  allUnitChunks,
  certificateData,
  currentUnitNumber = 0,
  currentChunkIndex = 0,
  onChunkSelect = () => {},
  onUnitSelect,
  applyCTAProps,
  courseProgressData,
  breadcrumb,
  navigationControls,
  mobileNavigation,
  onNavigate,
  children,
}) => {
  const router = useRouter();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileCourseMenuOpen, setIsMobileCourseMenuOpen] = useState(false);

  // Handle keyboard navigation with arrow keys and sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const { activeElement } = document;
      if (
        activeElement
        && (activeElement.tagName === 'INPUT'
          || activeElement.tagName === 'TEXTAREA'
          || activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // Handle sidebar toggle shortcut: Cmd+B (macOS) or Ctrl+B (Windows/Linux)
      // Use physical key detection (event.code) for consistent behavior across all keyboard layouts
      const isSidebarToggle
        = event.code === 'KeyB'
          && !event.altKey
          && !event.shiftKey
          && ((event.metaKey && !event.ctrlKey) || (event.ctrlKey && !event.metaKey));

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
          onNavigate?.(`Navigated to Unit ${targetUnitNumber}: ${targetUnit.title}`);
        }

        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          mobileNavigation?.onPrevClick();
          break;
        case 'ArrowRight':
          event.preventDefault();
          mobileNavigation?.onNextClick();
          break;
        default:
          // Ignore other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [router, units, mobileNavigation, onNavigate]);

  return (
    <div>
      {mobileNavigation && (
        <MobileHeader
          className="unit__mobile-header sticky top-(--nav-height-mobile) z-10 md:hidden"
          courseTitle={courseTitle}
          courseSlug={courseSlug}
          courseProgressData={courseProgressData}
          onCourseMenuClick={() => setIsMobileCourseMenuOpen(true)}
          {...mobileNavigation}
        />
      )}

      <div className="md:flex">
        {!isSidebarHidden && (
          <SideBar
            courseTitle={courseTitle}
            courseSlug={courseSlug}
            certificateData={certificateData}
            className="hidden md:sticky md:top-(--nav-height-mobile) md:block md:h-[calc(100vh-var(--nav-height-mobile))] md:shrink-0 md:overflow-y-auto lg:top-(--nav-height-desktop) lg:h-[calc(100vh-var(--nav-height-desktop))]"
            units={units}
            currentUnitNumber={currentUnitNumber}
            currentChunkIndex={currentChunkIndex}
            onChunkSelect={onChunkSelect}
            unitChunks={allUnitChunks}
            applyCTAProps={applyCTAProps}
            courseProgressData={courseProgressData}
          />
        )}

        <div className="md:min-w-0 md:flex-1">
          {/* Breadcrumbs bar */}
          <div className="unit__breadcrumbs-wrapper border-bluedot-navy/20 bg-color-canvas z-10 hidden h-[48px] border-b-[0.5px] md:sticky md:top-(--nav-height-mobile) md:block lg:top-(--nav-height-desktop)">
            <div className="flex size-full flex-row items-center justify-between gap-2 px-6">
              {/* Left section: Hide/Show Toggle */}
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                  className="text-size-xs text-bluedot-navy flex cursor-pointer items-center gap-[8px] font-medium transition-opacity hover:opacity-80"
                  aria-label={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
                >
                  <FaBars className="size-[16px]" />
                  <span className="tracking-[-0.005em]">{isSidebarHidden ? 'Show' : 'Hide'}</span>
                </button>
                <span className="h-[18px] w-px bg-[#6A6F7A] opacity-50" />
              </div>

              {/* Breadcrumbs - left aligned after hide */}
              <nav className="flex min-h-[18px] min-w-0 flex-1 items-center gap-[8px]">
                <A
                  href={ROUTES.courses.url}
                  className="text-size-xs hover:text-bluedot-navy leading-[18px] font-medium tracking-[-0.005em] text-[#6A6F7A] no-underline transition-colors"
                >
                  Courses
                </A>
                <FaChevronRight className="size-[14px] flex-shrink-0 text-[#6A6F7A] opacity-50" />
                <A
                  href={`/courses/${courseSlug}`}
                  className="text-size-xs hover:text-bluedot-navy truncate leading-[18px] font-medium tracking-[-0.005em] text-[#6A6F7A] no-underline transition-colors"
                >
                  {courseTitle}
                </A>
                <FaChevronRight className="size-[14px] flex-shrink-0 text-[#6A6F7A] opacity-50" />
                <span className="text-size-xs text-bluedot-navy truncate leading-[18px] font-medium tracking-[-0.005em]">
                  {breadcrumb}
                </span>
              </nav>

              {/* Right section: Navigation */}
              {navigationControls && (
                <div className="flex min-h-[18px] items-center gap-[20px]">{navigationControls}</div>
              )}
            </div>
          </div>
          {children}
        </div>
      </div>

      {mobileNavigation && (
        <MobileCourseModal
          isOpen={isMobileCourseMenuOpen}
          setIsOpen={setIsMobileCourseMenuOpen}
          certificateData={certificateData}
          courseTitle={courseTitle}
          courseSlug={courseSlug}
          units={units}
          currentUnitNumber={currentUnitNumber}
          currentChunkIndex={currentChunkIndex}
          onChunkSelect={onChunkSelect}
          onUnitSelect={onUnitSelect}
          unitChunks={allUnitChunks}
          applyCTAProps={applyCTAProps}
          courseProgressData={courseProgressData}
        />
      )}
    </div>
  );
};

export default CourseShell;
