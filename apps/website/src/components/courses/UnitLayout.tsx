import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import {
  Section,
  CTALinkOrButton,
} from '@bluedot/ui';
import {
  FaBars, FaChevronRight,
} from 'react-icons/fa6';

import { unitTable, chunkTable, InferSelectModel } from '@bluedot/db';
import SideBar from './SideBar';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import Congratulations from './Congratulations';
import { ROUTES } from '../../lib/routes';
import UnitFeedback from './UnitFeedback';
import CertificateLinkCard from './CertificateLinkCard';
import { A, H1, P } from '../Text';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

type UnitLayoutProps = {
  // Required
  chunks: Chunk[];
  unit: Unit;
  unitNumber: number;
  units: Unit[];
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
}) => {
  return (
    <div className={clsx('mobile-unit-header bg-color-canvas border-b border-color-divider w-full p-3', className)}>
      <nav className="mobile-unit-header__nav flex flex-row justify-between">
        <A className="mobile-unit-header__prev-unit-cta flex flex-row items-center gap-1 no-underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-color-primary focus:ring-offset-2" disabled={isFirstChunk && !prevUnit} onClick={onPrevClick} aria-label="Previous unit">
          <img src="/icons/bubble-arrow.svg" alt="" className="size-8" />
        </A>
        <div className="mobile-unit-header__course-container flex flex-row gap-2 items-center">
          <img src="/icons/course.svg" className="size-8" alt="" />
          <div className="mobile-unit-header__course-title-container flex flex-col">
            <p className="mobile-unit-header__course-header text-size-xxs text-[#999eb3]">{unit.courseTitle}</p>
            <p className="mobile-unit-header__course-title bluedot-h4 text-size-xs">{unit.title}</p>
          </div>
        </div>
        <A className="mobile-unit-header__next-unit-cta flex flex-row items-center gap-1 no-underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-color-primary focus:ring-offset-2" disabled={isLastChunk && !nextUnit} onClick={onNextClick} aria-label="Next unit">
          <img src="/icons/bubble-arrow.svg" alt="" className="size-8 rotate-180" />
        </A>
      </nav>
    </div>
  );
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  chunks,
  unit,
  unitNumber,
  units,
}) => {
  const router = useRouter();
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [navigationAnnouncement, setNavigationAnnouncement] = useState('');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const unitArrIndex = units.findIndex((u) => u.id === unit.id);

  const isFirstChunk = currentChunkIndex === 0;
  const isLastChunk = currentChunkIndex === chunks.length - 1;

  const nextUnit = units[unitArrIndex + 1];
  const prevUnit = units[unitArrIndex - 1];

  // Update chunk index when query param changes
  useEffect(() => {
    const chunkParam = router.query.chunk;
    if (typeof chunkParam === 'string') {
      const chunkIndex = parseInt(chunkParam, 10);
      if (!Number.isNaN(chunkIndex) && chunkIndex >= 0 && chunkIndex < chunks.length) {
        setCurrentChunkIndex(chunkIndex);
      }
    }
  }, [router.query.chunk, chunks.length]);

  const handleChunkSelect = useCallback((index: number) => {
    setCurrentChunkIndex(index);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, chunk: index },
    }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Announce navigation for screen readers
    const chunkTitle = chunks[index]?.chunkTitle || 'content';
    setNavigationAnnouncement(`Navigated to ${chunkTitle}`);
  }, [router, chunks]);

  const handlePrevClick = useCallback(() => {
    if ((isFirstChunk || chunks.length === 0) && prevUnit) {
      // Navigate to last chunk of previous unit
      router.push(`${prevUnit.path}?chunk=${(prevUnit.chunks?.length ?? 0) - 1}`);
      setNavigationAnnouncement(`Navigated to previous unit: ${prevUnit.title}`);
    } else if (!isFirstChunk) {
      // Navigate to previous chunk
      handleChunkSelect(currentChunkIndex - 1);
    }
  }, [isFirstChunk, chunks.length, prevUnit, currentChunkIndex, router, handleChunkSelect]);

  const handleNextClick = useCallback(() => {
    if ((isLastChunk || chunks.length === 0) && nextUnit) {
      // Navigate to first chunk of next unit
      router.push(`${nextUnit.path}?chunk=0`);
      setNavigationAnnouncement(`Navigated to next unit: ${nextUnit.title}`);
    } else if (!isLastChunk) {
      // Navigate to next chunk
      handleChunkSelect(currentChunkIndex + 1);
    }
  }, [isLastChunk, chunks.length, nextUnit, currentChunkIndex, router, handleChunkSelect]);

  // Handle keyboard navigation with arrow keys
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

      // Ignore if modifier keys are pressed
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevClick, handleNextClick]);

  if (!unit || unitArrIndex === -1) {
    // Should never happen
    throw new Error('Unit not found');
  }

  return (
    <div>
      <Head>
        <title>{`${unit.courseTitle}: Unit ${unitNumber}`}</title>
        <meta name="description" content={unit.title} />
      </Head>

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
        className="unit__mobile-header md:hidden sticky top-16 z-10"
        unit={unit}
        prevUnit={prevUnit}
        nextUnit={nextUnit}
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
        isFirstChunk={isFirstChunk}
        isLastChunk={isLastChunk}
      />

      {/* Sidebar - positioned fixed and separate from main layout flow */}
      {!isSidebarHidden && (
        <SideBar
          courseTitle={unit.courseTitle}
          className="hidden md:block md:fixed md:overflow-y-auto md:max-h-[calc(100vh-57px)]" // Adjust for Nav height only
          units={units}
          currentUnitNumber={unitNumber}
          chunks={chunks}
          currentChunkIndex={currentChunkIndex}
          onChunkSelect={handleChunkSelect}
        />
      )}

      {/* Breadcrumbs bar - positioned sticky and full width */}
      <div className={clsx(
        'unit__breadcrumbs-wrapper hidden md:block md:sticky md:top-16 z-10 border-b-[0.5px] border-[rgba(19,19,46,0.2)] h-[48px] bg-color-canvas',
        isSidebarHidden ? 'md:ml-0' : 'md:ml-[360px]',
      )}
      >
        <div className="flex flex-row justify-between items-center size-full px-6 gap-2">
          {/* Left section: Hide/Show Toggle */}
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setIsSidebarHidden(!isSidebarHidden)}
              className="flex items-center gap-[8px] text-[13px] font-medium text-[#13132E] hover:opacity-80 transition-opacity"
              aria-label={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
            >
              <FaBars className="size-[16px]" />
              <span className="tracking-[-0.005em]">{isSidebarHidden ? 'Show' : 'Hide'}</span>
            </button>
            <span className="w-px h-[18px] bg-[#6A6F7A] opacity-50" />
          </div>

          {/* Breadcrumbs - left aligned after hide */}
          <nav className="flex items-center gap-[8px] flex-1 min-h-[18px]">
            <A
              href={ROUTES.courses.url}
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline inline-flex items-center"
            >
              Courses
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <A
              href={unit.coursePath}
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline inline-flex items-center"
            >
              {unit.courseTitle}
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <span className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] inline-flex items-center">
              {unitNumber}. {unit.title}
            </span>
          </nav>

          {/* Right section: Navigation */}
          <div className="flex items-center gap-[20px] min-h-[18px]">
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFirstChunk && !prevUnit}
              onClick={handlePrevClick}
              aria-label="Previous"
              title="Navigate to previous section (use ← arrow key)"
            >
              ← Prev
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Main content section - positioned below breadcrumbs */}
      <Section className="unit__main !border-none !pt-0 !mt-0">
        <div className={clsx(
          'unit__content flex flex-col flex-1 max-w-full md:max-w-[680px] lg:max-w-[800px] xl:max-w-[900px] mx-auto gap-6 px-4 sm:px-spacing-x pt-24',
          isSidebarHidden ? 'md:ml-0' : 'md:ml-[360px]',
        )}
        >
          <div className="unit__title-container">
            <P className="unit__course-title font-semibold text-[13px] leading-[140%] tracking-[0.04em] uppercase text-[#2244BB] mb-2">Unit {unit.unitNumber}: {unit.title}</P>
            {chunks[currentChunkIndex]?.chunkTitle && (
              <H1 className="unit__title font-bold text-[32px] leading-[130%] tracking-[-0.015em] text-[#13132E]">{chunks[currentChunkIndex].chunkTitle}</H1>
            )}
          </div>
          <MarkdownExtendedRenderer>
            {chunks[currentChunkIndex]?.chunkContent || unit.content || ''}
          </MarkdownExtendedRenderer>

          {/* Keyboard navigation hint */}
          <div className="unit__keyboard-hint text-size-xs text-color-secondary mt-4">
            <p>Tip: Use arrow keys (← →) to navigate between sections</p>
          </div>

          {isLastChunk && (
            <UnitFeedback unit={unit} />
          )}

          {(!nextUnit && isLastChunk) ? (
            <>
              <Congratulations courseTitle={unit.courseTitle} coursePath={unit.coursePath} courseId={unit.courseId} />
              <CertificateLinkCard courseId={unit.courseId} />
              <div className="unit__last-unit-cta-container flex flex-row justify-between mx-1">
                <CTALinkOrButton className="last-unit__cta-link mx-auto" url={unit.coursePath} variant="secondary">
                  Back to course
                </CTALinkOrButton>
              </div>
            </>
          ) : (
            // Margin-bottom is added to accommodate the Circle widget on mobile screens
            <div className="unit__cta-container flex flex-row justify-between mt-6 mx-1 mb-14 sm:mb-0">
              <CTALinkOrButton
                className="unit__cta-link ml-auto"
                onClick={handleNextClick}
                variant="primary"
                withChevron
              >
                {isLastChunk ? 'Complete unit and continue' : 'Continue'}
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
