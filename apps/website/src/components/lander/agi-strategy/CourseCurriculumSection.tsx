import { useState } from 'react';
import {
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { CgChevronDown } from 'react-icons/cg';
import type { Unit } from '@bluedot/db';
import { H2, P } from '../../Text';
import type { GetCourseResponse } from '../../../pages/api/courses/[courseSlug]';

/* Common Section Wrapper */
const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <section className="w-full bg-white">
    <div className="max-w-max-width mx-auto px-spacing-x py-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
      <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
        Curriculum Overview
      </H2>
      {children}
    </div>
  </section>
);

const CourseCurriculumSection = () => {
  const [{ data, loading, error }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: '/api/courses/agi-strategy',
  });

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex justify-center">
          <ProgressDots />
        </div>
      </SectionWrapper>
    );
  }

  if (!data?.units || data.units.length === 0) {
    return (
      <SectionWrapper>
        <P className="text-center">Curriculum information will be available soon.</P>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper>
      <div className="max-w-[928px] mx-auto">
        <div>
          {[...data.units]
            .sort((a, b) => {
              const aNum = parseInt(a.unitNumber || '0', 10);
              const bNum = parseInt(b.unitNumber || '0', 10);
              return aNum - bNum;
            })
            .map((unit, index) => (
              <CurriculumUnit key={unit.id} unit={unit} defaultExpanded={index === 0} />
            ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

/* Curriculum Unit Component */
const CurriculumUnit = ({ unit, defaultExpanded = false }: { unit: Unit; defaultExpanded?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const unitTitle = (unit.courseUnit || unit.title || `Unit ${unit.unitNumber}`)
    .replace(/^AGI Strategy\s*-\s*/i, '')
    .trim();
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
