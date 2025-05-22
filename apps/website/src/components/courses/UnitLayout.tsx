import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import {
  Section,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa6';

import SideBar from './SideBar';
import { Unit, Chunk } from '../../lib/api/db/tables';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import Congratulations from './Congratulations';
import { ROUTES } from '../../lib/routes';
import UnitFeedback from './UnitFeedback';
import CertificateLinkCard from './CertificateLinkCard';
import { A, H1, P } from '../Text';

type UnitLayoutProps = {
  // Required
  chunks: Chunk[];
  unit: Unit;
  unitNumber: number;
  units: Unit[];
};

type MobileHeaderProps = {
  chunks: Chunk[];
  currentChunkIndex: number;
  className?: string;
  unit: Unit;
  prevUnit?: Unit;
  nextUnit?: Unit;
  onPrevClick: () => void;
  onNextClick: () => void;
};

const MobileHeader: React.FC<MobileHeaderProps> = ({
  className,
  unit,
  chunks,
  currentChunkIndex,
  prevUnit,
  nextUnit,
  onPrevClick,
  onNextClick,
}) => {
  return (
    <div className={clsx('mobile-unit-header bg-color-canvas border-b border-color-divider w-full p-3', className)}>
      <nav className="mobile-unit-header__nav flex flex-row justify-between">
        <A className="mobile-unit-header__prev-unit-cta flex flex-row items-center gap-1 no-underline disabled:opacity-50" disabled={!prevUnit} onClick={onPrevClick} aria-label="Previous unit">
          <img src="/icons/bubble-arrow.svg" alt="" className="size-8" />
        </A>
        <div className="mobile-unit-header__course-container flex flex-row gap-2 items-center">
          <img src="/icons/course.svg" className="size-8" alt="" />
          <div className="mobile-unit-header__course-title-container flex flex-col">
            <p className="mobile-unit-header__course-header text-size-xxs text-[#999eb3]">{unit.courseTitle}</p>
            <p className="mobile-unit-header__course-title bluedot-h4 text-size-xs">{chunks[currentChunkIndex]?.chunkTitle}</p>
          </div>
        </div>
        <A className="mobile-unit-header__next-unit-cta flex flex-row items-center gap-1 no-underline disabled:opacity-50" disabled={!nextUnit} onClick={onNextClick} aria-label="Next unit">
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

  const handleChunkSelect = (index: number) => {
    setCurrentChunkIndex(index);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, chunk: index },
    }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevClick = () => {
    if ((isFirstChunk || chunks.length === 0) && prevUnit) {
      // Navigate to last chunk of previous unit
      router.push(`${prevUnit.path}?chunk=${(prevUnit.chunks?.length ?? 0) - 1}`);
    } else if (!isFirstChunk) {
      // Navigate to previous chunk
      handleChunkSelect(currentChunkIndex - 1);
    }
  };

  const handleNextClick = () => {
    if ((isLastChunk || chunks.length === 0) && nextUnit) {
      // Navigate to first chunk of next unit
      router.push(`${nextUnit.path}?chunk=0`);
    } else if (!isLastChunk) {
      // Navigate to next chunk
      handleChunkSelect(currentChunkIndex + 1);
    }
  };

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

      <Breadcrumbs
        className="unit__breadcrumbs hidden md:block md:sticky md:top-16 z-10"
        route={{
          title: unit.courseTitle,
          url: unit.coursePath,
          parentPages: [ROUTES.home, ROUTES.courses],
        }}
      >
        <div className="unit__breadcrumbs-cta-container flex flex-row items-center gap-6">
          <button
            type="button"
            className="unit__breadcrumbs-cta flex flex-row items-center gap-1 no-underline cursor-pointer hover:text-color-primary disabled:opacity-50 disabled:hover:text-inherit disabled:cursor-not-allowed"
            disabled={isFirstChunk && !prevUnit}
            onClick={handlePrevClick}
            aria-label="Previous"
          >
            <FaArrowLeft className="size-3" /> Prev
          </button>
          <button
            type="button"
            className="unit__breadcrumbs-cta flex flex-row items-center gap-1 no-underline cursor-pointer hover:text-color-primary disabled:opacity-50 disabled:hover:text-inherit disabled:cursor-not-allowed"
            disabled={isLastChunk && !nextUnit}
            onClick={handleNextClick}
            aria-label="Next"
          >
            Next <FaArrowRight className="size-3" />
          </button>
        </div>
      </Breadcrumbs>

      <MobileHeader
        chunks={chunks}
        currentChunkIndex={currentChunkIndex}
        className="unit__mobile-header md:hidden sticky top-16 z-10"
        unit={unit}
        prevUnit={prevUnit}
        nextUnit={nextUnit}
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
      />

      <Section className="unit__main !border-none">
        <div className="unit__content-container flex flex-col md:flex-row">
          <SideBar
            courseTitle={unit.courseTitle}
            className="hidden md:block md:fixed md:overflow-y-scroll md:max-h-[calc(100vh-57px-65px-42px)]" // Adjust for Nav, Breadcrumb, and padding heights
            units={units}
            currentUnitNumber={unitNumber}
            chunks={chunks}
            currentChunkIndex={currentChunkIndex}
            onChunkSelect={handleChunkSelect}
          />
          <div className="unit__content flex flex-col flex-1 max-w-[680px] mx-auto gap-6 px-0 md:px-spacing-x md:ml-[320px]">
            <div className="unit__title-container">
              <P className="unit__course-title text-size-sm mb-2">Unit {unit.unitNumber}</P>
              <H1 className="unit__title font-serif text-[32px]">{chunks[currentChunkIndex]?.chunkTitle}</H1>
            </div>
            <MarkdownExtendedRenderer>
              {chunks[currentChunkIndex]?.chunkContent || unit.content}
            </MarkdownExtendedRenderer>

            {isLastChunk && (
              <UnitFeedback unit={unit} />
            )}

            {(!nextUnit && isLastChunk) ? (
              <>
                <Congratulations courseTitle={unit.courseTitle} coursePath={unit.coursePath} />
                <CertificateLinkCard courseId={unit.courseId} />
                <div className="unit__last-unit-cta-container flex flex-row justify-between mx-1">
                  <CTALinkOrButton className="last-unit__cta-link mx-auto" url={unit.coursePath} variant="secondary">
                    Back to course
                  </CTALinkOrButton>
                </div>
              </>
            ) : (
              <div className="unit__cta-container flex flex-row justify-between mt-6 mx-1">
                <CTALinkOrButton
                  className="unit__cta-link ml-auto"
                  onClick={handleNextClick}
                  variant="primary"
                  withChevron
                >
                  Complete and continue
                </CTALinkOrButton>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
