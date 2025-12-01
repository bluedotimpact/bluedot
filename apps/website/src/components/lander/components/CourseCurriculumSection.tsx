import { useState } from 'react';
import {
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import { CgChevronDown } from 'react-icons/cg';
import type { Unit } from '@bluedot/db';
import { H2, P } from '../../Text';
import { trpc } from '../../../utils/trpc';

export type CourseCurriculumSectionProps = {
  /** The section heading displayed at the top */
  title: string;
  /**
   * The course slug used to fetch curriculum data from the API.
   * This should match the course slug in the database/API endpoint.
   * Example: "agi-strategy", "ai-alignment", "ai-governance"
   */
  courseSlug: string;
};

/* Common Section Wrapper */
const SectionWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="w-full bg-white">
    <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 md:px-spacing-x min-[1280px]:py-24 xl:py-24">
      <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
        {title}
      </H2>
      {children}
    </div>
  </section>
);

const CourseCurriculumSection = ({
  title,
  courseSlug,
}: CourseCurriculumSectionProps) => {
  const { data, isLoading: loading, error } = trpc.courses.getBySlug.useQuery({ courseSlug });

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
            .map((unit, index) => (
              <CurriculumUnit
                key={unit.id}
                unit={unit}
                courseSlug={courseSlug}
                defaultExpanded={index === 0}
              />
            ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

/* Curriculum Unit Component */
const CurriculumUnit = ({
  unit,
  courseSlug,
  defaultExpanded = false,
}: {
  unit: Unit;
  courseSlug: string;
  defaultExpanded?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  // Convert slug to readable course name (e.g., "agi-strategy" → "AGI Strategy")
  const courseName = courseSlug
    .split('-')
    .map((word) => word.toUpperCase())
    .join(' ');

  // Remove course prefix from unit titles dynamically
  const rawTitle = unit.courseUnit || unit.title || `Unit ${unit.unitNumber}`;

  // Create regex pattern to match the course name with optional hyphens or spaces
  // This handles both "AGI Strategy - Unit 1" and "AGI-Strategy - Unit 1" formats
  const coursePattern = courseName
    .split(' ')
    .join('[\\s-]'); // Allow either space or hyphen between words

  const regex = new RegExp(`^${coursePattern}\\s*-\\s*`, 'i');
  const unitTitle = rawTitle.replace(regex, '').trim();
  const description = unit.menuText || unit.description;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full [&:not(:first-child)]:border-t-[0.5px] [&:not(:first-child)]:border-[rgba(19,19,46,0.2)] bg-white">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-3 flex items-center gap-2 cursor-pointer transition-all duration-300 ease ${
          isOpen ? 'pt-[18px] pb-[6px]' : 'py-[18px]'
        } ${!isOpen ? 'hover:bg-gray-50' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2244BB]`}
        aria-expanded={isOpen}
        aria-controls={`curriculum-unit-${unit.id}`}
      >
        <h3 className="text-[16px] md:text-[18px] font-semibold leading-[125%] text-[#13132E] flex-1 text-left">
          {unitTitle}
        </h3>
        <div className="size-5 flex items-center justify-center">
          <CgChevronDown
            className={`size-4 md:size-5 text-[#13132E] transition-transform duration-300 ease ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
        </div>
      </button>

      {/* Description container with animation */}
      <div
        id={`curriculum-unit-${unit.id}`}
        className={`grid transition-[grid-template-rows] duration-300 ease ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {description && (
            <div className="px-3 pb-[18px]">
              <div className="pl-6">
                <div className="text-[16px] font-normal leading-[160%] text-[#13132E] opacity-80 whitespace-pre-line">
                  {description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCurriculumSection;
