import { useState } from 'react';
import {
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { FaChevronDown } from 'react-icons/fa';
import type { Unit } from '@bluedot/db';
import { H2, P } from '../../Text';
import type { GetCourseResponse } from '../../../pages/api/courses/[courseSlug]';

/* Common Section Wrapper */
const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <section className="w-full bg-white">
    <div className="max-w-max-width mx-auto px-spacing-x pt-12 pb-8 md:pt-20 md:pb-12 lg:pt-24 lg:pb-16">
      <H2 className="text-[28px] md:text-[32px] lg:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
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
        <div className="max-h-[400px] overflow-y-auto scrollbar-curriculum pr-3">
          <div className="pb-[120px]">
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
          {/* Fade gradient at bottom */}
          <div className="sticky bottom-0 h-[102px] bg-gradient-to-t from-white via-white/[0.93] to-transparent pointer-events-none -mt-[102px]" />
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
    <div className="w-full">
      {isOpen ? (
        /* Expanded Unit */
        <div className="bg-white">
          <div className="py-[18px] px-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] md:text-[18px] font-semibold leading-[125%] text-[#13132E] flex-1">
                {unitTitle}
              </h3>
              <button
                type="button"
                onClick={handleToggle}
                className="size-5 flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2244BB]"
                aria-expanded={isOpen}
                aria-controls={`curriculum-unit-${unit.id}`}
              >
                <FaChevronDown className="size-3 text-[#13132E] transition-transform duration-200" />
              </button>
            </div>
            {description && (
              <div className="pl-6">
                <div className="text-[16px] font-normal leading-[160%] text-[#13132E] opacity-80 whitespace-pre-line">
                  {description}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Unit */
        <div className="border-t-[0.5px] border-[rgba(19,19,46,0.2)] bg-white">
          <button
            type="button"
            onClick={handleToggle}
            className="w-full py-[18px] px-3 flex items-center gap-2 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2244BB]"
            aria-expanded={isOpen}
            aria-controls={`curriculum-unit-${unit.id}`}
          >
            <h3 className="text-[16px] md:text-[18px] font-semibold leading-[125%] text-[#13132E] flex-1 text-left">
              {unitTitle}
            </h3>
            <div className="size-5 flex items-center justify-center">
              <FaChevronDown className="size-3 text-[#13132E] -rotate-90 transition-transform duration-200" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseCurriculumSection;
