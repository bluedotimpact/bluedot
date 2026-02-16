import { useState, useMemo, useCallback } from 'react';
import {
  ErrorSection,
  H2,
  P,
  ProgressDots,
} from '@bluedot/ui';
import { CgChevronDown, CgTime } from 'react-icons/cg';
import type { Unit } from '@bluedot/db';
import type { TRPCClientErrorLike } from '@trpc/client';
import { trpc } from '../../../utils/trpc';
import type { AppRouter } from '../../../server/routers/_app';

export type CourseCurriculumSectionProps = {
  title: string;
  courseSlug: string;
};

type UnitMetadata = {
  duration: number | null;
  exerciseCount: number;
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

const SectionWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="w-full bg-white">
    <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 md:px-spacing-x min-[1280px]:py-24 xl:py-24">
      <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center mb-12 md:mb-16 tracking-[-0.01em]">
        {title}
      </H2>
      {children}
    </div>
  </section>
);

const UnitMetadataDisplay = ({
  duration,
  exerciseCount,
  isLoading,
  hasError,
}: {
  duration: number | null;
  exerciseCount: number;
  isLoading?: boolean;
  hasError?: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-[18px] w-[50px] animate-pulse rounded bg-bluedot-navy/10" />
        <span className="text-[13px] text-bluedot-navy/60">·</span>
        <div className="h-[18px] w-[70px] animate-pulse rounded bg-bluedot-navy/10" />
      </div>
    );
  }

  if (hasError) {
    return null;
  }

  if (!duration && exerciseCount === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {duration != null && (
        <>
          <CgTime className="size-[18px] text-[#13132E] opacity-60" />
          <span className="text-[13px] font-medium leading-[1.4] tracking-[-0.065px] text-bluedot-navy/60">
            {formatDuration(duration)}
          </span>
        </>
      )}
      {duration != null && exerciseCount > 0 && (
        <span className="text-[13px] font-medium leading-[1.4] tracking-[-0.065px] text-bluedot-navy/60">
          ·
        </span>
      )}
      {exerciseCount > 0 && (
        <span className="text-[13px] font-medium leading-[1.4] tracking-[-0.065px] text-bluedot-navy/60">
          {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
        </span>
      )}
    </div>
  );
};

const CurriculumUnit = ({
  unit,
  courseSlug,
  metadata,
  metadataLoading,
  metadataError,
  onExpand,
  defaultExpanded = false,
}: {
  unit: Unit;
  courseSlug: string;
  metadata?: UnitMetadata;
  metadataLoading?: boolean;
  metadataError?: TRPCClientErrorLike<AppRouter> | null;
  onExpand?: () => void;
  defaultExpanded?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  // Convert slug to readable course name (e.g., "agi-strategy" → "AGI Strategy")
  const courseName = courseSlug
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  const rawTitle = unit.courseUnit || unit.title || `Unit ${unit.unitNumber}`;

  // Strip redundant course prefix: "AGI Strategy - Unit 1: Intro" → "Unit 1: Intro"
  const coursePattern = courseName.split(' ').join('[\\s-]');
  const regex = new RegExp(`^${coursePattern}\\s*-\\s*`, 'i');
  const unitTitle = rawTitle.replace(regex, '').trim();
  const description = unit.menuText || unit.description;

  const handleToggle = () => {
    if (!isOpen && onExpand) {
      onExpand();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full [&:not(:first-child)]:border-t-[0.5px] [&:not(:first-child)]:border-[rgba(19,19,46,0.2)] bg-white">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-3 flex items-center gap-2 cursor-pointer transition-all duration-300 ease ${
          isOpen ? 'pt-[18px] pb-3' : 'py-[18px]'
        } ${!isOpen ? 'hover:bg-gray-50' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-bluedot-normal`}
        aria-expanded={isOpen}
        aria-controls={`curriculum-unit-${unit.id}`}
      >
        <h3 className="text-[16px] md:text-[18px] font-semibold leading-[125%] text-bluedot-navy flex-1 text-left">
          {unitTitle}
        </h3>
        <div className="size-5 flex items-center justify-center">
          <CgChevronDown
            className={`size-4 md:size-5 text-bluedot-navy transition-transform duration-300 ease ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
        </div>
      </button>

      <div
        id={`curriculum-unit-${unit.id}`}
        className={`grid transition-[grid-template-rows] duration-300 ease ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pb-[18px] pl-[36px] pr-3 max-[679px]:pl-6">
            {description && (
              <div className="text-[16px] font-normal leading-[160%] text-[#13132E] opacity-80 whitespace-pre-line">
                {description}
              </div>
            )}
            {(metadataLoading || metadata || metadataError) && (
              <UnitMetadataDisplay
                duration={metadata?.duration ?? null}
                exerciseCount={metadata?.exerciseCount ?? 0}
                isLoading={metadataLoading}
                hasError={!!metadataError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseCurriculumSection = ({
  title,
  courseSlug,
}: CourseCurriculumSectionProps) => {
  const { data, isLoading: loading, error } = trpc.courses.getBySlug.useQuery({ courseSlug });

  const [hasExpandedAny, setHasExpandedAny] = useState(false);

  // Only fetch metadata when user expands a unit (lazy load)
  const {
    data: metadata,
    isLoading: metadataLoading,
    error: metadataError,
  } = trpc.courses.getCurriculumMetadata.useQuery(
    { courseSlug },
    { enabled: hasExpandedAny },
  );

  const metadataMap = useMemo(() => {
    if (!metadata) return new Map<string, UnitMetadata>();
    return new Map(metadata.map((m) => [m.unitId, { duration: m.duration, exerciseCount: m.exerciseCount }]));
  }, [metadata]);

  const handleFirstExpand = useCallback(() => {
    if (!hasExpandedAny) {
      setHasExpandedAny(true);
    }
  }, [hasExpandedAny]);

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return (
      <SectionWrapper title={title}>
        <ProgressDots />
      </SectionWrapper>
    );
  }

  if (!data?.units || data.units.length === 0) {
    return (
      <SectionWrapper title={title}>
        <P className="text-center">Curriculum information will be available soon.</P>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title={title}>
      <div className="max-w-[928px] mx-auto">
        <div>
          {[...data.units]
            .sort((a, b) => {
              const aNum = parseInt(a.unitNumber || '0', 10);
              const bNum = parseInt(b.unitNumber || '0', 10);
              return aNum - bNum;
            })
            .map((unit) => (
              <CurriculumUnit
                key={unit.id}
                unit={unit}
                courseSlug={courseSlug}
                metadata={metadataMap.get(unit.id)}
                metadataLoading={metadataLoading}
                metadataError={metadataError}
                onExpand={handleFirstExpand}
                defaultExpanded={false}
              />
            ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default CourseCurriculumSection;
