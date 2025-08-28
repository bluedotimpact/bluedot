import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import {
  Section,
  CTALinkOrButton,
} from '@bluedot/ui';
import {
  FaChevronRight, FaBars,
} from 'react-icons/fa6';

import {
  courseTable, unitTable, chunkTable, unitResourceTable, exerciseTable, InferSelectModel,
} from '@bluedot/db';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import { ROUTES } from '../../lib/routes';
import {
  A, H1, H2, P,
} from '../Text';
import { ResourceDisplay } from './ResourceDisplay';
import SideBar from './SideBar';

type Course = InferSelectModel<typeof courseTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;
type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;
type Exercise = InferSelectModel<typeof exerciseTable.pg>;

type ChunkWithContent = Chunk & {
  resources: UnitResource[];
  exercises: Exercise[];
};

type UnitWithChunks = {
  unit: Unit;
  chunks: ChunkWithContent[];
  unitNumber: number;
};

type AllChunksLayoutProps = {
  course: Course;
  allChunks: UnitWithChunks[];
};

const AllChunksLayout: React.FC<AllChunksLayoutProps> = ({
  course,
  allChunks,
}) => {
  const router = useRouter();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [currentVisibleUnit, setCurrentVisibleUnit] = useState<number>(1);
  const [currentVisibleChunk, setCurrentVisibleChunk] = useState<number>(0);

  // Scroll detection using Intersection Observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px', // Trigger when section is 50% visible
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const unitMatch = target.id.match(/^unit-(\d+)$/);
          const chunkMatch = target.id.match(/^unit-(\d+)-chunk-(\d+)$/);

          if (chunkMatch && chunkMatch[1] && chunkMatch[2]) {
            const unitNum = parseInt(chunkMatch[1]);
            const chunkNum = parseInt(chunkMatch[2]);
            setCurrentVisibleUnit(unitNum);
            setCurrentVisibleChunk(chunkNum);
          } else if (unitMatch && unitMatch[1]) {
            const unitNum = parseInt(unitMatch[1]);
            setCurrentVisibleUnit(unitNum);
            setCurrentVisibleChunk(0);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all unit and chunk sections
    allChunks.forEach((unitWithChunks) => {
      const unitElement = document.getElementById(`unit-${unitWithChunks.unitNumber}`);
      if (unitElement) observer.observe(unitElement);

      unitWithChunks.chunks.forEach((chunk, chunkIndex) => {
        const chunkElement = document.getElementById(`unit-${unitWithChunks.unitNumber}-chunk-${chunkIndex}`);
        if (chunkElement) observer.observe(chunkElement);
      });
    });

    return () => observer.disconnect();
  }, [allChunks]);

  const handleBackToChunks = () => {
    // Navigate to the first unit of the course
    if (allChunks.length > 0 && allChunks[0]) {
      const firstUnit = allChunks[0].unit;
      router.push(firstUnit.path || '/courses');
    } else {
      router.push(course.path || '/courses');
    }
  };

  const handleChunkSelect = useCallback((unitNumber: number, chunkIndex: number) => {
    // Calculate the offset needed to account for sticky headers
    // Nav height (64px) + breadcrumb height (48px) + some padding (16px) = 128px total offset
    const scrollOffset = 128;
    
    // Always scroll to the specific chunk, but ensure unit context is visible
    const targetElement = chunkIndex === 0 
      ? document.getElementById(`unit-${unitNumber}`)
      : document.getElementById(`unit-${unitNumber}-chunk-${chunkIndex}`);
    
    if (targetElement) {
      // Get the current scroll position to avoid unnecessary jumps
      const currentScrollY = window.pageYOffset;
      const elementTop = targetElement.getBoundingClientRect().top + currentScrollY;
      const targetPosition = elementTop - scrollOffset;
      
      // Only scroll if we're not already close to the target position
      const scrollThreshold = 50; // pixels
      if (Math.abs(currentScrollY - targetPosition) > scrollThreshold) {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
      
      // Update state immediately without waiting for scroll
      setCurrentVisibleUnit(unitNumber);
      setCurrentVisibleChunk(chunkIndex);
    }
  }, []);

  // Get all chunks in order for navigation
  const getAllChunksInOrder = useCallback(() => {
    const chunksInOrder: { unitNumber: number; chunkIndex: number; unit: Unit; chunk: ChunkWithContent }[] = [];
    allChunks.forEach((unitWithChunks) => {
      unitWithChunks.chunks.forEach((chunk, chunkIndex) => {
        chunksInOrder.push({
          unitNumber: unitWithChunks.unitNumber,
          chunkIndex,
          unit: unitWithChunks.unit,
          chunk,
        });
      });
    });
    return chunksInOrder;
  }, [allChunks]);

  // Navigation functions
  const navigateToNextChunk = useCallback(() => {
    const chunksInOrder = getAllChunksInOrder();
    const currentIndex = chunksInOrder.findIndex(
      (item) => item.unitNumber === currentVisibleUnit && item.chunkIndex === currentVisibleChunk,
    );

    if (currentIndex !== -1 && currentIndex < chunksInOrder.length - 1) {
      const nextChunk = chunksInOrder[currentIndex + 1];
      if (nextChunk) {
        handleChunkSelect(nextChunk.unitNumber, nextChunk.chunkIndex);
      }
    }
  }, [currentVisibleUnit, currentVisibleChunk, getAllChunksInOrder, handleChunkSelect]);

  const navigateToPrevChunk = useCallback(() => {
    const chunksInOrder = getAllChunksInOrder();
    const currentIndex = chunksInOrder.findIndex(
      (item) => item.unitNumber === currentVisibleUnit && item.chunkIndex === currentVisibleChunk,
    );

    if (currentIndex > 0) {
      const prevChunk = chunksInOrder[currentIndex - 1];
      if (prevChunk) {
        handleChunkSelect(prevChunk.unitNumber, prevChunk.chunkIndex);
      }
    }
  }, [currentVisibleUnit, currentVisibleChunk, getAllChunksInOrder, handleChunkSelect]);

  const navigateToUnit = useCallback((unitNumber: number) => {
    const targetUnit = allChunks.find((uc) => uc.unitNumber === unitNumber);
    if (targetUnit && targetUnit.chunks.length > 0) {
      handleChunkSelect(unitNumber, 0);
    }
  }, [allChunks, handleChunkSelect]);

  // Handle keyboard navigation
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
        event.preventDefault();
        navigateToUnit(targetUnitNumber);
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateToPrevChunk();
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToNextChunk();
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
  }, [navigateToPrevChunk, navigateToNextChunk, navigateToUnit]);

  return (
    <div>
      {/* Sidebar - positioned fixed and separate from main layout flow */}
      {!isSidebarHidden && (
        <SideBar
          courseTitle={course.title}
          className="hidden md:block md:fixed md:overflow-y-auto md:max-h-[calc(100vh-57px)]" // Adjust for Nav height only
          allChunks={allChunks}
          currentUnitNumber={currentVisibleUnit}
          currentChunkIndex={currentVisibleChunk}
          onChunkSelect={handleChunkSelect}
        />
      )}

      {/* Breadcrumbs bar - positioned sticky and full width */}
      <div className={clsx(
        'all-chunks__breadcrumbs-wrapper hidden md:block md:sticky md:top-16 z-10 border-b-[0.5px] border-[rgba(19,19,46,0.2)] h-[48px] bg-color-canvas',
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
          <nav className="flex items-center gap-[8px] flex-1 min-h-[18px]">
            <A
              href={ROUTES.courses.url}
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline inline-flex items-center"
            >
              Courses
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <A
              href={course.path}
              className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#6A6F7A] hover:text-[#13132E] transition-colors no-underline inline-flex items-center"
            >
              {course.title}
            </A>
            <FaChevronRight className="size-[14px] text-[#6A6F7A] flex-shrink-0 opacity-50" />
            <span className="text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] inline-flex items-center">
              Full Course
            </span>
          </nav>

          {/* Right section: Back to Chunks button */}
          <div className="flex items-center gap-[20px] min-h-[18px]">
            <button
              type="button"
              className="flex items-center gap-1 text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#13132E] hover:opacity-80 transition-opacity cursor-pointer"
              onClick={handleBackToChunks}
              aria-label="Back to Chunks"
            >
              ← Back to Chunks
            </button>
          </div>
        </div>
      </div>

      {/* Main content section - positioned below breadcrumbs */}
      <Section className="all-chunks__main !border-none !pt-0 !mt-0">
        <div className={clsx(
          'all-chunks__content flex flex-col flex-1 max-w-full md:max-w-[680px] lg:max-w-[800px] xl:max-w-[900px] mx-auto px-5 sm:px-spacing-x pt-6 md:pt-8',
          !isSidebarHidden && 'md:ml-[360px]',
        )}
        >
          {/* Course title */}
          <div className="all-chunks__header mb-8">
            <P className="all-chunks__course-title font-semibold text-[13px] leading-[140%] tracking-[0.04em] uppercase text-[#2244BB] mb-2">
              {course.title}
            </P>
            <H1 className="all-chunks__title font-bold text-[32px] leading-[130%] tracking-[-0.015em] text-[#13132E]">
              Full Course
            </H1>
          </div>

          {/* Render all units and chunks */}
          {allChunks.map((unitWithChunks, unitIndex) => (
            <div key={unitWithChunks.unit.id} className="all-chunks__unit" id={`unit-${unitWithChunks.unitNumber}`}>
              {/* Unit separator (except for first unit) */}
              {unitIndex > 0 && (
                <div className="all-chunks__unit-separator border-t border-[rgba(19,19,46,0.2)] my-12" />
              )}

              {/* Unit header */}
              <div className="all-chunks__unit-header mb-8">
                <H2 className="font-bold text-[24px] leading-[130%] tracking-[-0.015em] text-[#13132E]">
                  Unit {unitWithChunks.unitNumber}: {unitWithChunks.unit.title}
                </H2>
              </div>

              {/* Render all chunks in this unit */}
              {unitWithChunks.chunks.map((chunk, chunkIndex) => (
                <div key={chunk.id} className="all-chunks__chunk mb-8" id={`unit-${unitWithChunks.unitNumber}-chunk-${chunkIndex}`}>
                  {/* Chunk title */}
                  {chunk.chunkTitle && (
                    <div className="all-chunks__chunk-title mb-4">
                      <h3 className="font-semibold text-[20px] leading-[130%] tracking-[-0.01em] text-[#13132E]">
                        {chunk.chunkTitle}
                      </h3>
                    </div>
                  )}

                  {/* Chunk content */}
                  {chunk.chunkContent && (
                    <MarkdownExtendedRenderer className="mb-6">
                      {chunk.chunkContent}
                    </MarkdownExtendedRenderer>
                  )}

                  {/* Chunk resources and exercises */}
                  {(chunk.resources?.length || chunk.exercises?.length) && (
                    <ResourceDisplay
                      resources={chunk.resources || []}
                      exercises={chunk.exercises || []}
                      unitTitle={unitWithChunks.unit.title}
                      unitNumber={unitWithChunks.unitNumber}
                      className="mb-6"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Keyboard navigation hint */}
          <div className="all-chunks__keyboard-hint text-size-xs text-color-secondary mt-8">
            <p>Use ←/→ or 1-9 to navigate, and Cmd/Ctrl+B to toggle sidebar.</p>
          </div>

          {/* Bottom navigation */}
          <div className="all-chunks__bottom-nav flex flex-row justify-center mt-12 mb-8">
            <CTALinkOrButton
              onClick={handleBackToChunks}
              variant="secondary"
            >
              Back to Chunks
            </CTALinkOrButton>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AllChunksLayout;
