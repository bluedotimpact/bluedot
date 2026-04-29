import { H2, P } from '@bluedot/ui';
import { type ReactNode } from 'react';

export type CaseStudy = {
  name: string;
  story: ReactNode;
  imageSrc?: string;
};

export type CaseStudiesSectionProps = {
  title?: string;
  subtitle?: string;
  caseStudies: CaseStudy[];
};

const CaseStudiesSection = ({
  title = 'Case studies',
  subtitle,
  caseStudies,
}: CaseStudiesSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="text-center mb-12 md:mb-16">
          <H2 className="text-size-xl font-semibold leading-[125%] text-bluedot-navy tracking-[-0.01em]">
            {title}
          </H2>
          {subtitle && (
            <P className="text-size-md leading-[1.6] text-bluedot-navy/60 mt-3 italic">
              {subtitle}
            </P>
          )}
        </div>
        <div className="grid grid-cols-1 bd-md:grid-cols-2 gap-6 lg:gap-8 max-w-[900px] mx-auto">
          {caseStudies.map((study) => (
            <div
              key={study.name}
              className="flex flex-col gap-4 p-6 bd-md:p-8 bg-[#FAFAFA] rounded-xl"
            >
              <div className="flex items-center gap-4">
                {study.imageSrc && (
                  <img
                    src={study.imageSrc}
                    alt={study.name}
                    className="size-12 rounded-full object-cover"
                  />
                )}
                <span className="text-size-md font-semibold text-bluedot-navy">
                  {study.name}
                </span>
              </div>
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/80">
                {study.story}
              </P>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
